// =============================================================
// ELARAH — create-checkout-session Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-checkout-session
//
// Dois modos:
//
// (A) Reserva de experiência:
//   {
//     "experiencia_id": "uuid",
//     "horario":   "19h00 – 22h30",   // opcional
//     "email":     "cliente@dominio", // opcional (se logado)
//     "nome":      "Maria",           // opcional
//     "cupom":     "ELRH-XXXX-..."    // opcional, gift card
//   }
//
// (B) Compra de gift card:
//   {
//     "mode": "gift_card",
//     "gift_card_value_centavos": 20000,
//     "buyer_email":      "joao@dominio",
//     "buyer_nome":       "João",
//     "recipient_email":  "maria@dominio",
//     "recipient_nome":   "Maria",
//     "mensagem":         "Feliz aniversário!"
//   }
//
// Resposta padrão:
//   { url: "https://checkout.stripe.com/...", session_id: "cs_..." }
//
// Resposta no caso de gift card cobrir 100% (sem cobrança):
//   { direct: true, booking_id: "uuid" }
//
// Erros conhecidos (4xx):
//   experience_not_found      | 404
//   experience_sold_out       | 409  (sem vagas)
//   experience_cutoff_passed  | 409  (faltando < cutoff_hours)
//   gift_card_invalid         | 422
//   invalid_price             | 422
//
// Variáveis de ambiente:
//   STRIPE_SECRET_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   PUBLIC_SITE_URL          ex.: https://elarah.com.br
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  computeChargeAmount,
  assertExpectedTotal,
} from "../_shared/booking_guard.ts";
import {
  computeFinancialBreakdown,
  type SupplierRow,
} from "../_shared/financial.ts";
import { quoteForService, type ShippingOption } from "../_shared/shipping.ts";
import { getValidAccessToken } from "../_shared/melhor_envio.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PUBLIC_SITE_URL =
  (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/+$/, "") ||
  "https://elarah.com.br";

// ===== Taxa do cartão (repasse pro cliente) =====
// Lida uma vez no boot. Se o admin mudar as envs, basta redeploy da
// function. Defaults conservadores (0) — sem repasse se não tiver
// config, pra não quebrar deploys antigos silenciosamente.
// Parse tolerante: aceita vírgula OU ponto (BR digita "5,24") e cai no
// fallback se vier algo inválido — evita NaN no valor/exibição da taxa.
function parseFeeEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (raw == null || raw === "") return fallback;
  const n = Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0) {
    console.warn("[create-checkout-session] " + name + " inválido ('" + raw + "') — fallback " + fallback);
    return fallback;
  }
  return n;
}
const CARD_FEE_PERCENT = parseFeeEnv("CARD_FEE_PERCENT", 0);
const CARD_FEE_FIXED_CENTS = parseFeeEnv("CARD_FEE_FIXED_CENTS", 0);

// Calcula o preço final repassando a taxa do cartão ao cliente.
// Formula: final = base + round(base * percent/100) + fixed
// Arredondamento em centavos (Math.round) — consistente com parsing.
// PIX NÃO usa essa função — vai direto com o base_price.
function applyCardFee(baseCents: number): {
  finalCents: number;
  feePercentCents: number;
  feeFixedCents: number;
  feeTotalCents: number;
} {
  if (!Number.isFinite(baseCents) || baseCents <= 0) {
    return {
      finalCents: baseCents,
      feePercentCents: 0,
      feeFixedCents: 0,
      feeTotalCents: 0,
    };
  }
  const feePercentCents = Math.round(baseCents * (CARD_FEE_PERCENT / 100));
  const feeFixedCents = CARD_FEE_FIXED_CENTS;
  let feeTotalCents = feePercentCents + feeFixedCents;
  if (!Number.isFinite(feeTotalCents) || feeTotalCents < 0) feeTotalCents = 0;
  return {
    finalCents: baseCents + feeTotalCents,
    feePercentCents,
    feeFixedCents,
    feeTotalCents,
  };
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

// Cria a sessão de checkout tentando COM parcelamento (installments até 12x).
// Se a conta Stripe (Brasil) não suportar parcelamento, o Stripe erra ao criar
// a sessão; nesse caso refazemos SEM parcelamento pra NUNCA quebrar o checkout
// — o cliente paga à vista normalmente. Isso torna habilitar o 12x zero-risco:
// se a conta permitir, aparece; se não, cai no à vista sem erro pra ninguém.
// deno-lint-ignore no-explicit-any
async function createSessionWithInstallmentFallback(params: any) {
  try {
    return await stripe.checkout.sessions.create(params);
  } catch (err) {
    const msg = String((err && (err as any).message) || err).toLowerCase();
    const installmentIssue = msg.includes("installment") || msg.includes("parcel");
    if (installmentIssue && params && params.payment_method_options) {
      console.warn(
        "[create-checkout-session] parcelamento não suportado pela conta " +
          "Stripe; refazendo a sessão SEM installments (à vista).",
      );
      const fallback = { ...params };
      delete fallback.payment_method_options;
      return await stripe.checkout.sessions.create(fallback);
    }
    throw err;
  }
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// "R$ 1.234,50" / "R$383" / "383,00" -> 38300 (centavos)
function parsePrecoToCents(raw: unknown): number | null {
  if (raw == null) return null;
  const text = String(raw).replace(/\s/g, "").replace(/^R\$/i, "");
  if (!text) return null;
  // Formato BR: vírgula = decimal, ponto = milhar. Sem vírgula, qualquer
  // ponto é milhar — "1.320" = 1320 (não 1.32). Sem isso, Number("1.320")
  // virava 1.32 e cobrava R$1,32 por uma experiência de R$1.320.
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.replace(/\./g, "");
  const num = Number(normalized);
  if (!isFinite(num) || num <= 0) return null;
  return Math.round(num * 100);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// =============================================================
// MODO B — gift card purchase
// =============================================================
async function handleGiftCardPurchase(payload: Record<string, unknown>) {
  const valor = Number(payload.gift_card_value_centavos ?? 0);
  const buyerEmail = String(payload.buyer_email ?? "").trim();
  const buyerNome = String(payload.buyer_nome ?? "").trim();
  const recipientEmail = String(payload.recipient_email ?? "").trim();
  const recipientNome = String(payload.recipient_nome ?? "").trim();
  const mensagem = String(payload.mensagem ?? "").trim();

  if (!Number.isFinite(valor) || valor < 5000) {
    return jsonResponse({ error: "gift_card_min_value" }, 400);
  }
  if (valor > 500000) {
    return jsonResponse({ error: "gift_card_max_value" }, 400);
  }
  if (!recipientEmail || !/.+@.+\..+/.test(recipientEmail)) {
    return jsonResponse({ error: "recipient_email_required" }, 400);
  }

  // Resolve user_id do comprador (opcional)
  let buyerUserId: string | null = null;
  if (buyerEmail) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", buyerEmail)
      .maybeSingle();
    if (prof) buyerUserId = prof.id;
  }

  const successUrl =
    PUBLIC_SITE_URL + "/success.html?gift=1&session_id={CHECKOUT_SESSION_ID}";
  const cancelUrl = PUBLIC_SITE_URL + "/cancel.html";

  let session;
  try {
    session = await createSessionWithInstallmentFallback({
      mode: "payment",
      payment_method_types: ["card"],
      // Parcelamento em até 12x COM JUROS (repassado ao cliente). O cliente
      // escolhe as parcelas na tela do Stripe; o emissor cuida dos juros —
      // não impacta a margem da Elarah. Se a conta Stripe não suportar
      // parcelamento, createSessionWithInstallmentFallback refaz a sessão
      // sem installments — então nunca quebra (cai no à vista).
      payment_method_options: {
        card: { installments: { enabled: true } },
      },
      locale: "pt-BR",
      customer_email: buyerEmail || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: valor,
            product_data: {
              name: "Gift Card Elarah",
              description:
                ("Para " + (recipientNome || recipientEmail)).slice(0, 380),
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        kind: "gift_card",
        valor_centavos: String(valor),
        buyer_email: buyerEmail,
        buyer_nome: buyerNome,
        recipient_email: recipientEmail,
        recipient_nome: recipientNome,
        mensagem: mensagem.slice(0, 480),
      },
    });
  } catch (e) {
    console.error("[create-checkout-session/gift] stripe error", e);
    return jsonResponse({ error: "stripe_create_failed" }, 502);
  }

  // Pré-grava gift card como pending — webhook ativa. Se esta linha
  // falhar (tabela inexistente, coluna fora de sintonia, etc.), a
  // gente NÃO pode seguir pra Stripe: o cliente pagaria e o webhook
  // tentaria um fallback insert, mas se o problema é estrutural, o
  // fallback também falha e o pagamento fica "orfão" sem rastro no
  // admin. Por isso: se a pre-gravação falha, cancela a sessão Stripe
  // recém-criada e devolve erro pro front.
  const giftCardRow = {
    code: "PENDING-" + session.id.slice(-12).toUpperCase(),
    valor_inicial_centavos: valor,
    saldo_centavos: valor,
    status: "pending",
    comprador_user_id: buyerUserId,
    comprador_email: buyerEmail || null,
    comprador_nome: buyerNome || null,
    destinatario_email: recipientEmail,
    destinatario_nome: recipientNome || null,
    mensagem: mensagem || null,
    stripe_session_id: session.id,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { error: insertErr } = await supabase
    .from("gift_cards")
    .insert(giftCardRow);

  if (insertErr) {
    console.error(
      "[create-checkout-session/gift] FALHA CRÍTICA ao pré-gravar gift " +
        "card. Abortando pagamento pra não cobrar o cliente sem registro.",
      "session=" + session.id,
      "error=" + JSON.stringify(insertErr),
    );
    // Expira a sessão Stripe recém-criada pra garantir que o cliente
    // não consiga pagar num link órfão. Stripe aceita expire mesmo
    // antes de qualquer pagamento.
    try {
      await stripe.checkout.sessions.expire(session.id);
    } catch (e) {
      console.error(
        "[create-checkout-session/gift] não consegui expirar sessão",
        session.id,
        e,
      );
    }
    return jsonResponse(
      {
        error: "gift_card_save_failed",
        message: "Não foi possível registrar o gift card antes do " +
          "pagamento. Detalhe: " + (insertErr.message || "erro desconhecido"),
        hint:
          "Verifique se a migration sql/elarah_extensions.sql foi " +
          "executada no Supabase e se a tabela public.gift_cards existe.",
        detail: insertErr,
      },
      500,
    );
  }

  console.info(
    "[create-checkout-session/gift] gift card pré-gravado com sucesso",
    "session=" + session.id,
    "recipient=" + recipientEmail,
    "valor_centavos=" + valor,
  );

  return jsonResponse({ url: session.url, session_id: session.id });
}

// =============================================================
// MODO A — reserva de experiência
// =============================================================
// Marcador único de versão. Mude esse valor a cada release pra
// confirmar via logs do Supabase qual versão está rodando. Se você
// ver esse marcador nos logs ao testar uma reserva, o deploy passou
// e o código novo está ativo.
const CHECKOUT_FN_VERSION = "v6-coupons-redeploy-2026-04-29";

async function handleExperienceCheckout(payload: Record<string, unknown>) {
  console.info(
    "[Elarah Payment] handleExperienceCheckout INICIO",
    "version=" + CHECKOUT_FN_VERSION,
  );
  const experienciaId = String(payload.experiencia_id ?? "").trim();
  const horario = payload.horario ? String(payload.horario).trim() : null;
  // Data + slot_id vindos da UI nova (chips de data + horario em experiencia.html).
  // Quando presentes, lookup do slot é por (exp_id, horario, data) ou por slot_id
  // direto. Pra clientes legados (sem data/slot_id), comportamento antigo é mantido.
  const dataFromPayload = payload.data ? String(payload.data).trim() : null;
  const slotIdFromPayload = payload.slot_id ? String(payload.slot_id).trim() : null;
  const email = payload.email ? String(payload.email).trim() : null;
  const nomeFromPayload = payload.nome ? String(payload.nome).trim() : null;
  const cupomCode = payload.cupom ? String(payload.cupom).trim() : null;
  const quantidade = Math.max(1, Math.floor(Number(payload.quantidade) || 1));
  const participantes = Array.isArray(payload.participantes) ? payload.participantes : [];
  // Variantes (escolha extra do cliente, ex.: Pintura → Lagosta).
  // Persistidas em metadata.variant_label + metadata.variant_selected
  // pra exibir no e-mail e admin. Não afetam preço nem estoque.
  const variantLabel = payload.variant_label ? String(payload.variant_label).trim() : null;
  const variantSelected = payload.variant_selected ? String(payload.variant_selected).trim() : null;
  // Preço unitário da variação exibido no front (centavos). Só dica de
  // segurança — o banco continua autoritativo (ver bloco de preço abaixo).
  const variantExpectedCents = (function () {
    const n = Number(payload.variant_price_expected_centavos);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  })();

  // ===== Frete (kits físicos — Elarah em Casa) =====
  // Só presente quando o frontend manda `shipping` (fluxo de kit). Pra
  // experiências presenciais isso NUNCA vem → fluxo intacto. O custo é
  // SEMPRE recalculado no servidor mais abaixo (quoteForService); aqui
  // só guardamos a entrada do cliente (endereço + serviço escolhido).
  const shippingInput = (payload.shipping && typeof payload.shipping === "object")
    ? (payload.shipping as Record<string, unknown>)
    : null;

  // ===== Método de pagamento =====
  // Esta edge function agora só cuida de cartão. PIX é gerenciado
  // pela função separada create-mp-pix-payment (Mercado Pago).
  // Se o frontend velho mandar payment_method='pix' por engano aqui,
  // ignoramos e tratamos como cartão — o repasse de taxa vai ser
  // aplicado normalmente.
  const paymentMethod: "card" = "card";
  console.info(
    "[Elarah Payment] create-checkout-session (cartão)",
  );
  // ===== TELEFONE / WHATSAPP =====
  // Aceita tanto `telefone` (formato humano: "(11) 91234-5678")
  // quanto `telefone_digits` (só dígitos: "11912345678"). Se o
  // frontend antigo não enviar, cai em null — bookings antigas
  // continuam funcionando graças à coluna `telefone` ser nullable.
  const telefoneHuman = payload.telefone
    ? String(payload.telefone).trim()
    : null;
  const telefoneDigits = payload.telefone_digits
    ? String(payload.telefone_digits).replace(/\D+/g, "")
    : (telefoneHuman ? telefoneHuman.replace(/\D+/g, "") : null);
  const telefoneValid =
    telefoneDigits && telefoneDigits.length >= 10 && telefoneDigits.length <= 13;
  // Se o telefone for válido, usa o formato humano (melhor pra
  // exibir no admin). Senão, armazena o melhor que temos.
  const telefoneToSave = telefoneValid
    ? (telefoneHuman || telefoneDigits)
    : (telefoneHuman || null);
  if (!telefoneValid) {
    console.warn(
      "[create-checkout-session] telefone ausente ou inválido:",
      JSON.stringify({ raw: telefoneHuman, digits: telefoneDigits })
    );
  } else {
    console.info(
      "[create-checkout-session] telefone recebido:",
      telefoneDigits
    );
  }

  if (!experienciaId) {
    return jsonResponse({ error: "experiencia_id_required" }, 400);
  }

  // Busca a experiência (preço autoritativo + vagas + cutoff)
  const { data: exp, error: expErr } = await supabase
    .from("experiences")
    .select(
      "id, nome, preco, data, horario, horarios, endereco, bairro, vagas_total, vagas_restantes, event_at, cutoff_hours, is_active, created_by, fornecedor_nome, valor_cheio_centavos, percentual_repasse, valor_repasse_fixo_centavos",
    )
    .eq("id", experienciaId)
    .maybeSingle();

  if (expErr) {
    console.error("[create-checkout-session] experience lookup error", expErr);
    return jsonResponse({ error: "experience_lookup_failed" }, 500);
  }
  if (!exp) {
    return jsonResponse({ error: "experience_not_found" }, 404);
  }
  // Se a experiência foi ocultada pelo admin, bloqueia o checkout —
  // mesmo que alguém tenha o link direto. is_active === false esconde;
  // qualquer outra coisa (true, undefined em bancos sem a coluna) libera.
  if (exp.is_active === false) {
    return jsonResponse(
      {
        error: "experience_unavailable",
        message: "Esta experiência não está mais disponível.",
      },
      404,
    );
  }

  // ===== Fornecedor (supplier) lookup =====
  let fornecedorId: string | null = exp.created_by ?? null;
  let fornecedorNome: string | null = null;
  if (fornecedorId) {
    const { data: fornProf } = await supabase
      .from("profiles")
      .select("nome, partner_data")
      .eq("id", fornecedorId)
      .maybeSingle();
    if (fornProf) {
      fornecedorNome = (fornProf as any)?.partner_data?.marca || (fornProf as any)?.nome || null;
    }
  }

  // Use fornecedor_nome from experience if not found via profile
  if (!fornecedorNome && exp.fornecedor_nome) fornecedorNome = exp.fornecedor_nome;
  const expValorCheioCentavos = exp.valor_cheio_centavos ?? null;
  const expPercentualRepasse = Number(exp.percentual_repasse ?? 90);
  // Valor fixo por pessoa em centavos. Quando preenchido, sobrescreve
  // o percentual no calculo do repasse. Lido aqui pra passar pro
  // computeFinancialBreakdown via LegacyConfig.
  const expValorRepasseFixoCentavos =
    (exp as { valor_repasse_fixo_centavos?: number | null }).valor_repasse_fixo_centavos ?? null;

  // ===== Slot lookup (vagas por horário/data) =====
  // Prioridade:
  //   1. slot_id explícito (UI nova já enviou o id exato)
  //   2. (exp_id, horario, data) — quando UI mandou data específica
  //   3. (exp_id, horario) — legado, falha se houver múltiplos slots
  //      pro mesmo horário (recorrência) → cliente precisa enviar data
  let slotId: string | null = null;
  let useSlotVagas = false;
  // deno-lint-ignore no-explicit-any
  let slotRow: any = null;

  if (slotIdFromPayload) {
    const { data: sr } = await supabase
      .from("experience_slots")
      .select("id, vagas_total, vagas_restantes, event_at, is_active, horario, data")
      .eq("id", slotIdFromPayload)
      .eq("experience_id", exp.id)
      .maybeSingle();
    if (sr) {
      slotRow = sr;
      slotId = sr.id;
      useSlotVagas = true;
      if (sr.is_active === false) {
        return jsonResponse(
          { error: "slot_unavailable", message: "Este horário não está mais disponível." },
          409,
        );
      }
    }
  } else if (horario) {
    let query = supabase
      .from("experience_slots")
      .select("id, vagas_total, vagas_restantes, event_at, is_active, horario, data")
      .eq("experience_id", exp.id)
      .eq("horario", horario);
    if (dataFromPayload) {
      query = query.eq("data", dataFromPayload);
    }
    const { data: rows, error: slotErr } = await query;
    if (!slotErr && Array.isArray(rows) && rows.length > 0) {
      // Se múltiplos (recorrência sem data filtrada), pega o mais
      // próximo no futuro. Cliente novo sempre manda `data` → 1 match.
      const sorted = rows
        .filter((r) => r.is_active !== false)
        .sort((a, b) => {
          const ea = a.event_at ? new Date(a.event_at).getTime() : Infinity;
          const eb = b.event_at ? new Date(b.event_at).getTime() : Infinity;
          return ea - eb;
        });
      const sr = sorted[0];
      if (sr) {
        slotRow = sr;
        slotId = sr.id;
        useSlotVagas = true;
      } else if (rows.length > 0) {
        return jsonResponse(
          { error: "slot_unavailable", message: "Este horário não está mais disponível." },
          409,
        );
      }
    }
  }

  // ===== Cutoff =====
  const effectiveEventAt = (useSlotVagas && slotRow?.event_at) ? slotRow.event_at : exp.event_at;
  if (effectiveEventAt) {
    const cutoffH = Number(exp.cutoff_hours ?? 24);
    const eventTs = new Date(effectiveEventAt).getTime();
    const limit = Date.now() + cutoffH * 60 * 60 * 1000;
    if (limit > eventTs) {
      return jsonResponse(
        {
          error: "experience_cutoff_passed",
          message:
            "As reservas para esta experiência encerraram " +
            cutoffH +
            "h antes do evento.",
        },
        409,
      );
    }
  }

  // ===== Vagas — checagem prévia (não atômica) =====
  if (useSlotVagas) {
    if (
      slotRow.vagas_total !== null &&
      (slotRow.vagas_restantes === null || Number(slotRow.vagas_restantes) < quantidade)
    ) {
      const r = Number(slotRow.vagas_restantes || 0);
      return jsonResponse(
        { error: "slot_sold_out", message: r <= 0 ? "Este horário está esgotado." : `Só restam ${r} vaga(s) neste horário.` },
        409,
      );
    }
  } else if (
    exp.vagas_total !== null &&
    exp.vagas_total !== undefined &&
    (exp.vagas_restantes === null || Number(exp.vagas_restantes) < quantidade)
  ) {
    const r = Number(exp.vagas_restantes || 0);
    return jsonResponse(
      {
        error: "experience_sold_out",
        message: r <= 0 ? "Esta experiência está esgotada." : `Só restam ${r} vaga(s) nesta experiência.`,
      },
      409,
    );
  }

  let cents = parsePrecoToCents(exp.preco);
  // ===== Preço por variação (kits — Elarah em Casa) =====
  // Se o cliente escolheu uma variação E ela tem preço próprio em
  // experiences.variant_items, ESSE é o preço autoritativo. Recalculado
  // no servidor a partir do banco — nunca confia no valor do cliente.
  if (variantSelected) {
    let dbVariantCents: number | null = null;
    try {
      // Consulta SEPARADA da coluna variant_items (jsonb). Isolada de
      // propósito: se a migration sql/elarah_experiences_variant_items.sql
      // ainda não rodou, esta query falha e o catch mantém o preço base —
      // o checkout NUNCA quebra por causa da coluna nova.
      const { data: vRow } = await supabase
        .from("experiences")
        .select("variant_items")
        .eq("id", experienciaId)
        .maybeSingle();
      const items = Array.isArray((vRow as { variant_items?: unknown[] } | null)?.variant_items)
        ? (vRow as { variant_items: unknown[] }).variant_items
        : [];
      const want = variantSelected.trim().toLowerCase();
      const match = items.find((it) => {
        const nome = (it && typeof it === "object")
          ? String((it as Record<string, unknown>).nome ?? (it as Record<string, unknown>).name ?? "")
          : String(it ?? "");
        return nome.trim().toLowerCase() === want;
      });
      if (match && typeof match === "object") {
        const vPreco = (match as Record<string, unknown>).preco ??
          (match as Record<string, unknown>).price;
        dbVariantCents = parsePrecoToCents(vPreco);
      }
    } catch (e) {
      console.warn("[create-checkout-session] falha ao consultar preço da variação no banco", e);
    }

    if (dbVariantCents) {
      cents = dbVariantCents;
      console.info(
        "[create-checkout-session] preço por variação aplicado (banco)",
        "variante=" + variantSelected,
        "cents=" + dbVariantCents,
      );
    } else if (
      variantExpectedCents != null &&
      cents != null &&
      variantExpectedCents > cents
    ) {
      // Rede de proteção: banco não resolveu o preço da variação. Usa a dica
      // do front SÓ quando maior que o base (upward-only — o cliente nunca
      // consegue pagar a menos por aqui). Evita cobrar o valor individual
      // quando o cliente escolheu a opção mais cara (ex.: "Dupla").
      console.warn(
        "[create-checkout-session] variant_items no banco não resolveu preço — usando dica do front (maior que o base)",
        "variante=" + variantSelected,
        "base_cents=" + cents,
        "hint_cents=" + variantExpectedCents,
        "ação=verifique se variant_items desta experiência tem o preço da opção",
      );
      cents = variantExpectedCents;
    }
  }
  if (!cents) {
    console.error("[create-checkout-session] invalid price", exp.preco);
    return jsonResponse({ error: "invalid_price" }, 422);
  }

  // ===== Resolve user_id + nome do profile (fallback) =====
  // Fallback: se o frontend não mandou nome mas o e-mail bate com um
  // profile cadastrado, usa o profile.nome. Isso cobre integrações
  // antigas do front e garante que a booking sempre nasça com um nome
  // se houver alguma fonte disponível.
  let userId: string | null = null;
  let profileNome: string | null = null;
  if (email) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("email", email)
      .maybeSingle();
    if (prof) {
      userId = prof.id;
      if (prof.nome && String(prof.nome).trim()) {
        profileNome = String(prof.nome).trim();
      }
    }
  }

  // Fonte da verdade do nome: payload > profile. Persistido tanto na
  // coluna `bookings.nome` quanto no `session.metadata.nome` (safety
  // net pro webhook reconstruir em caso de pre-insert perdido).
  const nome = nomeFromPayload || profileNome;
  if (!nome) {
    console.warn(
      "[create-checkout-session] nome ausente — payload=" +
        (nomeFromPayload ? "yes" : "no") +
        " profile=" + (profileNome ? "yes" : "no") +
        " email=" + (email || "?"),
    );
  }

  // ===== Hold cupom OU gift card (se cupom enviado) =====
  // Tenta primeiro o sistema novo `coupons` (percentual, restrição por
  // experiência, validade, limite de uso). Se não encontrar, cai pro
  // gift_cards legado. Backward compat preservada.
  const baseBreakdown = computeChargeAmount(cents, quantidade, 0);
  const totalCents = baseBreakdown.subtotalCents;
  let giftCardId: string | null = null;
  let giftCardCentavos = 0;
  let couponId: string | null = null;
  let couponDiscountCents = 0;

  if (cupomCode) {
    // Tenta cupom novo primeiro
    const { data: cpRows, error: cpErr } = await supabase.rpc(
      "hold_coupon",
      {
        p_code: cupomCode,
        p_experience_id: exp.id,
        p_amount_centavos: totalCents,
        p_quantidade: quantidade,
      },
    );
    if (cpErr) {
      console.warn(
        "[create-checkout-session] hold_coupon falhou, fallback pra gift_card",
        cpErr.message,
      );
    } else {
      const row = Array.isArray(cpRows) ? cpRows[0] : cpRows;
      if (row && row.ok === true) {
        couponId = row.coupon_id ?? null;
        couponDiscountCents = Number(row.discount_centavos || 0);
        giftCardCentavos = couponDiscountCents; // mesmo tracking de "valor abatido"
      } else if (row && row.coupon_id) {
        // Existe na tabela coupons mas inválido — não cai pro gift_card.
        return jsonResponse(
          {
            error: "coupon_invalid",
            message: row?.message || "Cupom inválido.",
          },
          422,
        );
      }
    }

    if (!couponId) {
      const { data: holdRows, error: holdErr } = await supabase.rpc(
        "hold_gift_card",
        { p_code: cupomCode, p_amount_centavos: totalCents },
      );
      if (holdErr) {
        console.error("[create-checkout-session] hold gift_card error", holdErr);
        return jsonResponse({ error: "gift_card_lookup_failed" }, 500);
      }
      const hold = Array.isArray(holdRows) ? holdRows[0] : holdRows;
      if (!hold || !hold.ok) {
        return jsonResponse(
          {
            error: "gift_card_invalid",
            message: hold?.message || "Cupom inválido.",
          },
          422,
        );
      }
      giftCardId = hold.gift_card_id;
      giftCardCentavos = Number(hold.used_centavos || 0);
    }
  }

  // Helper unificado de rollback do código aplicado (cupom OU gift_card).
  // Usado em todos os pontos onde a função aborta após ter feito o hold.
  const refundCupomAplicado = async () => {
    if (giftCardId) {
      await supabase.rpc("refund_gift_card", {
        p_gift_card_id: giftCardId,
        p_amount_centavos: giftCardCentavos,
      }).catch((e) => console.warn("[create-checkout-session] refund_gift_card falhou", e));
    }
    if (couponId) {
      await supabase.rpc("refund_coupon", { p_coupon_id: couponId })
        .catch((e) => console.warn("[create-checkout-session] refund_coupon falhou", e));
    }
  };

  // Recalcula com o desconto pra ter o breakdown final auditável.
  const breakdown = computeChargeAmount(cents, quantidade, giftCardCentavos);
  let amountToCharge = breakdown.totalCents;

  console.info(
    "[Elarah Payment/Stripe] QUANTIDADE DEBUG",
    "payload.quantidade=" + quantidade,
    "unitCents=" + cents,
    "totalCents=" + totalCents,
    "giftCardCentavos=" + giftCardCentavos,
    "subtotal=" + breakdown.subtotalCents,
    "discount=" + breakdown.discountCents,
    "amountToCharge=" + amountToCharge,
  );

  // ===== Repasse da taxa do cartão =====
  // Aplica SOMENTE quando o método é 'card' E ainda resta valor a
  // cobrar (>0). PIX nunca recebe fee. Gift card 100% também não.
  // A taxa é calculada sobre o valor restante (depois do desconto do
  // cupom), não sobre o preço cheio — o cliente paga taxa só sobre o
  // que efetivamente cai no cartão.
  const baseBeforeFeeCents = amountToCharge;
  let feeInfo = {
    finalCents: amountToCharge,
    feePercentCents: 0,
    feeFixedCents: 0,
    feeTotalCents: 0,
  };
  if (amountToCharge > 0) {
    feeInfo = applyCardFee(amountToCharge);
    amountToCharge = feeInfo.finalCents;
    console.info(
      "[Elarah Payment] taxa do cartão aplicada",
      "base=" + baseBeforeFeeCents,
      "fee_percent=" + feeInfo.feePercentCents,
      "fee_fixed=" + feeInfo.feeFixedCents,
      "total=" + amountToCharge,
      "percent_config=" + CARD_FEE_PERCENT,
      "fixed_config=" + CARD_FEE_FIXED_CENTS,
    );
  }

  // ===== Decremento atômico de vaga (com fallback robusto) =====
  // Estratégia em 3 camadas pra NUNCA derrubar o checkout por
  // problema de schema/RPC. Se o controle de estoque falha por
  // causa de versão antiga das funções no banco, pula o controle
  // (loga ERROR alto pro admin agir) — pagamento tem que continuar.
  //
  //   1ª: RPC moderno `decrement_*_vagas(uuid, p_qty integer)`
  //       — assinatura definida em sql/elarah_bookings_quantidade.sql
  //   2ª: Se a 1ª falhar (ex.: função com p_qty não existe no banco),
  //       cai pra versão legada `decrement_*_vagas(uuid)` em loop
  //       (uma chamada por vaga)
  //   3ª: Se mesmo a legada falhar, PULA o decremento, loga loud e
  //       segue o pagamento. Pequeno risco de overbooking transitório
  //       é PREFERÍVEL a quebrar o checkout inteiro em produção.
  //
  // O incrementVaga (rollback) usa a mesma estratégia na ordem inversa,
  // sem disparar erro: rollback "best effort" — se não conseguir, loga.
  const slotIdLocal = slotId;
  const expIdLocal = exp.id;
  const useSlotVagasLocal = useSlotVagas;
  const quantidadeLocal = quantidade;
  const decrementRpc = useSlotVagasLocal
    ? "decrement_slot_vagas"
    : "decrement_experience_vagas";
  const incrementRpc = useSlotVagasLocal
    ? "increment_slot_vagas"
    : "increment_experience_vagas";
  const baseArg = useSlotVagasLocal
    ? { p_slot_id: slotIdLocal }
    : { p_experience_id: expIdLocal };

  type DecrementOutcome =
    | { kind: "ok" }
    | { kind: "sold_out" }
    | { kind: "skipped"; reason: string };

  async function tryDecrementVagasSafe(): Promise<DecrementOutcome> {
    // Camada 1: tenta com p_qty (RPC moderno)
    const modern = await supabase.rpc(decrementRpc, {
      ...baseArg,
      p_qty: quantidadeLocal,
    });
    if (!modern.error) {
      const row = Array.isArray(modern.data) ? modern.data[0] : modern.data;
      if (row && row.ok === false) return { kind: "sold_out" };
      return { kind: "ok" };
    }
    console.warn(
      "[create-checkout-session] decrement com p_qty falhou — tentando versão legada",
      "rpc=" + decrementRpc,
      "error=" + JSON.stringify(modern.error),
      "hint=rode sql/elarah_bookings_quantidade.sql no Supabase pra atualizar",
    );

    // Camada 2: legada sem p_qty, em loop. Se ficar parcialmente
    // feita, devolve as vagas que já decrementou pra evitar drift.
    let decrementedSoFar = 0;
    for (let i = 0; i < quantidadeLocal; i++) {
      const legacy = await supabase.rpc(decrementRpc, baseArg);
      if (legacy.error) {
        // Compensa parcial best-effort
        for (let j = 0; j < decrementedSoFar; j++) {
          await supabase.rpc(incrementRpc, baseArg).catch(() => {});
        }
        console.error(
          "[create-checkout-session] decrement legacy TAMBÉM falhou — pulando controle de estoque pra não derrubar pagamento",
          "rpc=" + decrementRpc,
          "error=" + JSON.stringify(legacy.error),
        );
        return {
          kind: "skipped",
          reason: String(legacy.error.message || "rpc_unavailable"),
        };
      }
      const row = Array.isArray(legacy.data) ? legacy.data[0] : legacy.data;
      if (row && row.ok === false) {
        for (let j = 0; j < decrementedSoFar; j++) {
          await supabase.rpc(incrementRpc, baseArg).catch(() => {});
        }
        return { kind: "sold_out" };
      }
      decrementedSoFar += 1;
    }
    return { kind: "ok" };
  }

  // Acompanha quantas vagas o decremento efetivou pra que o rollback
  // saiba o que devolver. "skipped" = nenhuma vaga decrementada → no-op.
  let vagasDecrementadas = 0;
  let estoquePulado = false;

  const outcome = await tryDecrementVagasSafe();
  if (outcome.kind === "sold_out") {
    await refundCupomAplicado();
    const soldOutMsg = useSlotVagasLocal
      ? "Este horário está esgotado."
      : "Esta experiência está esgotada.";
    return jsonResponse(
      {
        error: useSlotVagasLocal ? "slot_sold_out" : "experience_sold_out",
        message: soldOutMsg,
      },
      409,
    );
  }
  if (outcome.kind === "skipped") {
    estoquePulado = true;
    console.error(
      "[Elarah Payment] CONTROLE DE ESTOQUE PULADO — pagamento prosseguindo sem decremento de vagas",
      "experiencia=" + exp.id,
      "slot=" + (slotIdLocal ?? "none"),
      "quantidade=" + quantidadeLocal,
      "reason=" + outcome.reason,
      "ação=admin precisa rodar sql/elarah_bookings_quantidade.sql no Supabase",
    );
  } else {
    vagasDecrementadas = quantidadeLocal;
  }

  // Helper pra rollback — best effort. Tenta moderna primeiro, depois
  // legada em loop. Se nenhuma vaga foi decrementada (estoque pulado),
  // não faz nada — manter consistente com o que efetivamente mudou.
  const incrementVaga = async () => {
    if (vagasDecrementadas <= 0) return;
    const modern = await supabase
      .rpc(incrementRpc, { ...baseArg, p_qty: vagasDecrementadas })
      .catch((e) => ({ error: e }));
    if (!modern.error) return;
    console.warn(
      "[create-checkout-session] increment com p_qty falhou — tentando legacy em loop",
      "rpc=" + incrementRpc,
      "error=" + JSON.stringify(modern.error),
    );
    for (let i = 0; i < vagasDecrementadas; i++) {
      await supabase.rpc(incrementRpc, baseArg).catch(() => {});
    }
  };

  // ===== Cálculo financeiro (mapa de divisão) =====
  // Busca rows de experience_suppliers (modelo novo, 1:N). Se a
  // experiência ainda usa o legado (1 fornecedor + percentual_repasse),
  // computeFinancialBreakdown faz o fallback automático.
  // Multiplica valor cheio por quantidade ANTES — cada vaga gera
  // o mesmo repasse pra cada fornecedor.
  const valorCheioFinal = expValorCheioCentavos
    ? expValorCheioCentavos * quantidade
    : null;

  let suppliers: SupplierRow[] = [];
  try {
    const { data: supRows, error: supErr } = await supabase
      .from("experience_suppliers")
      .select("fornecedor_nome, share_type, share_value, ordem, notas")
      .eq("experience_id", exp.id)
      .order("ordem", { ascending: true });
    if (supErr) {
      console.warn(
        "[Elarah Payment] experience_suppliers lookup falhou — fallback no legado",
        supErr.message,
      );
    } else if (Array.isArray(supRows)) {
      suppliers = supRows as SupplierRow[];
    }
  } catch (e) {
    console.warn("[Elarah Payment] experience_suppliers exception", e);
  }

  const breakdownFin = valorCheioFinal != null
    ? computeFinancialBreakdown(
        valorCheioFinal,
        suppliers,
        {
          type: (exp as { comissao_type?: string | null }).comissao_type ?? null,
          value: (exp as { comissao_value?: number | null }).comissao_value ?? null,
        },
        {
          fornecedorNome: fornecedorNome,
          percentualRepasse: expPercentualRepasse,
          // Multiplica por quantidade aqui porque o shared trata o
          // legado fixo como valor TOTAL ja vezes qty.
          valorRepasseFixoCentavos: expValorRepasseFixoCentavos != null
            ? Number(expValorRepasseFixoCentavos) * quantidade
            : null,
        },
      )
    : null;

  const valorRepasseCentavos = breakdownFin ? breakdownFin.totalRepasseCentavos : null;
  const valorComissaoCentavos = breakdownFin ? breakdownFin.comissaoCentavos : null;
  // Mantém fornecedor_nome legado preenchido com o "principal"
  // (primeiro da lista) pra retrocompat com painel antigo.
  if (breakdownFin && breakdownFin.fornecedorPrincipal) {
    fornecedorNome = breakdownFin.fornecedorPrincipal;
  }
  const repassesArray = breakdownFin ? breakdownFin.repasses : [];

  if (breakdownFin) {
    console.info(
      "[Elarah Payment] mapa financeiro",
      "valor_cheio=" + valorCheioFinal,
      "n_suppliers=" + repassesArray.length,
      "total_repasse=" + valorRepasseCentavos,
      "comissao=" + valorComissaoCentavos,
      "legacy_fallback=" + (breakdownFin.usedLegacyFallback ? "yes" : "no"),
    );
  }

  // ===== CASO 1: gift card cobre 100% — pula Stripe =====
  if (amountToCharge === 0) {
    const directBookingId = crypto.randomUUID();
    const { error: directErr } = await supabase.from("bookings").insert({
      id: directBookingId,
      user_id: userId,
      email: email ?? "",
      nome: nome,
      telefone: telefoneToSave,
      experiencia_id: exp.id,
      experiencia_nome: exp.nome,
      data: slotRow?.data ?? dataFromPayload ?? exp.data ?? null,
      horario: horario,
      preco_label: exp.preco,
      amount_total: 0,
      currency: "brl",
      status: "pago",
      stripe_session_id: "GIFT-" + directBookingId.slice(0, 12),
      gift_card_id: giftCardId,
      gift_card_centavos: giftCardCentavos,
      gift_card_code: cupomCode,
      coupon_id: couponId,
      coupon_code: couponId ? cupomCode : null,
      coupon_discount_centavos: couponId ? couponDiscountCents : null,
      slot_id: slotId,
      quantidade: quantidade,
      fornecedor_nome: fornecedorNome,
      fornecedor_id: fornecedorId,
      valor_cheio_centavos: valorCheioFinal,
      valor_repasse_centavos: valorRepasseCentavos,
      valor_comissao_centavos: valorComissaoCentavos,
      repasses: repassesArray.length ? repassesArray : null,
      status_fornecedor: "repasse_pendente",
      metadata: {
        bairro: exp.bairro ?? null,
        endereco: exp.endereco ?? null,
        paid_with_gift_card_only: true,
        telefone_digits: telefoneDigits || null,
        participantes: participantes,
      },
    });

    if (directErr) {
      console.error(
        "[create-checkout-session] direct booking insert error",
        directErr,
      );
      // Rollback: devolve cupom + vaga.
      await refundCupomAplicado();
      await incrementVaga();
      return jsonResponse({ error: "booking_failed" }, 500);
    }

    return jsonResponse({
      direct: true,
      booking_id: directBookingId,
      paid_with_gift_card: true,
      gift_card_centavos: giftCardCentavos,
    });
  }

  // ===== CASO 2: cobrança parcial ou total no Stripe =====
  const successUrl =
    PUBLIC_SITE_URL + "/success.html?session_id={CHECKOUT_SESSION_ID}";
  const cancelUrl = PUBLIC_SITE_URL + "/cancel.html";

  const productName = giftCardCentavos > 0
    ? exp.nome + " (com gift card)"
    : exp.nome;

  // Esta function agora atende somente cartão. PIX foi migrado pra
  // create-mp-pix-payment (Mercado Pago). Pagamento síncrono: o
  // webhook recebe `checkout.session.completed` com payment_status
  // 'paid' e marca a booking como 'pago' imediatamente.

  // Sanity check antes de bater no Stripe: se por qualquer motivo
  // amountToCharge sair menor do que (unit*qty - desconto), aborta —
  // evita cobrar a menos. Taxa do cartão pode somar acima, então a
  // checagem é >= não ==.
  try {
    assertExpectedTotal(breakdown, amountToCharge, "stripe checkout session");
  } catch (e) {
    console.error("[create-checkout-session] assertExpectedTotal falhou", e);
    await refundCupomAplicado();
    await incrementVaga();
    return jsonResponse(
      { error: "amount_mismatch", message: "Erro interno no cálculo do total. Recarregue e tente novamente." },
      500,
    );
  }

  // ===== Construção dos line_items =====
  // Regra: quando NÃO há gift card, passa quantity=quantidade explícito
  // pra Stripe e separa a taxa do cartão como linha distinta. A multi-
  // plicação fica visível no boundary (Dashboard, recibo) e qualquer
  // regressão futura que devolva preço unitário em vez de total fica
  // pega pelo assert abaixo.
  // Quando HÁ gift card, o desconto pode não dividir exatamente entre
  // as vagas, então mantemos quantity=1 com unit_amount=total — único
  // caso em que a opacidade é justificada.
  const descricaoLinha = [
    exp.data,
    horario,
    exp.bairro,
  ].filter(Boolean).join(" · ").slice(0, 380);

  // deno-lint-ignore no-explicit-any
  const lineItems: any[] = [];
  if (giftCardCentavos > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "brl",
        unit_amount: amountToCharge,
        product_data: {
          name: productName +
            (quantidade > 1 ? " (x" + quantidade + ")" : ""),
          description: [
            quantidade > 1 ? quantidade + " vagas" : null,
            descricaoLinha,
          ].filter(Boolean).join(" · ").slice(0, 380),
        },
      },
    });
  } else {
    lineItems.push({
      quantity: quantidade,
      price_data: {
        currency: "brl",
        unit_amount: cents,
        product_data: {
          name: exp.nome + (variantSelected ? " — " + variantSelected : ""),
          description: descricaoLinha,
        },
      },
    });
    if (feeInfo.feeTotalCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: feeInfo.feeTotalCents,
          product_data: {
            name: "Taxa de processamento (cartão)",
          },
        },
      });
    }
  }

  // ===== Frete: recalcula no servidor e adiciona como item =====
  // Recalcula o custo do serviço escolhido a partir do CEP (não confia
  // no valor do cliente). Soma ao amountToCharge ANTES do assert, então
  // a checagem de boundary continua válida.
  let shippingCents = 0;
  let shippingResolved: ShippingOption | null = null;
  if (shippingInput) {
    const cepDest = String(shippingInput.cep ?? "").replace(/\D+/g, "");
    const service = String(shippingInput.service ?? "").trim();
    if (cepDest.length === 8 && service) {
      // Token do Melhor Envio (OAuth), renovado sozinho se necessário.
      // null → recalcula via estimativa/free conforme SHIPPING_MODE.
      const meToken = await getValidAccessToken().catch(() => null);
      shippingResolved = await quoteForService(cepDest, service, {
        weight_kg: shippingInput.weight_kg != null ? Number(shippingInput.weight_kg) : undefined,
      }, meToken);
    }
    if (!shippingResolved) {
      await refundCupomAplicado();
      await incrementVaga();
      return jsonResponse(
        {
          error: "shipping_unavailable",
          message: "Não foi possível confirmar o frete. Recalcule o frete e tente de novo.",
        },
        422,
      );
    }
    // Custo 0 = frete grátis: coletamos o endereço, mas NÃO adicionamos
    // line item (Stripe não aceita item de R$0) nem somamos ao total.
    shippingCents = Math.max(0, shippingResolved.cost_centavos);
    if (shippingCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: shippingCents,
          product_data: {
            name: "Frete — " + shippingResolved.carrier + " " + shippingResolved.service,
          },
        },
      });
      amountToCharge += shippingCents;
    }
  }

  // Assert defensivo de boundary: a soma dos line_items que vamos
  // submeter pra Stripe TEM que bater com amountToCharge. Se algum
  // refactor futuro quebrar a multiplicação por quantidade, essa
  // checagem aborta antes de cobrar a menos.
  const stripeLineItemsSum = lineItems.reduce(
    // deno-lint-ignore no-explicit-any
    (acc: number, li: any) =>
      acc + Number(li.quantity ?? 1) * Number(li.price_data?.unit_amount ?? 0),
    0,
  );
  if (stripeLineItemsSum !== amountToCharge) {
    console.error(
      "[Elarah Payment/Stripe] LINE ITEMS SUM MISMATCH",
      "esperado=" + amountToCharge,
      "calculado=" + stripeLineItemsSum,
      "quantidade=" + quantidade,
      "unitCents=" + cents,
      "subtotal=" + breakdown.subtotalCents,
      "discount=" + breakdown.discountCents,
      "fee=" + feeInfo.feeTotalCents,
    );
    await refundCupomAplicado();
    await incrementVaga();
    return jsonResponse(
      {
        error: "stripe_line_items_mismatch",
        message:
          "Erro interno: total dos itens não confere com o valor a cobrar. " +
          "Recarregue e tente novamente.",
      },
      500,
    );
  }

  let session;
  try {
    session = await createSessionWithInstallmentFallback({
      mode: "payment",
      payment_method_types: ["card"],
      // Parcelamento em até 12x COM JUROS (repassado ao cliente). O cliente
      // escolhe as parcelas na tela do Stripe; o emissor cuida dos juros —
      // não impacta a margem da Elarah. Se a conta Stripe não suportar
      // parcelamento, createSessionWithInstallmentFallback refaz a sessão
      // sem installments — então nunca quebra (cai no à vista).
      payment_method_options: {
        card: { installments: { enabled: true } },
      },
      locale: "pt-BR",
      customer_email: email || undefined,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        kind: "experience",
        experiencia_id: exp.id,
        experiencia_nome: exp.nome,
        data: slotRow?.data ?? dataFromPayload ?? exp.data ?? "",
        horario: horario ?? "",
        slot_id: slotId ?? "",
        quantidade: String(quantidade),
        email: email ?? "",
        nome: nome ?? "",
        // Telefone também vai pro metadata como safety net —
        // se o pre-insert falhar por qualquer motivo, o webhook
        // pode reconstruir a booking com o telefone a partir daqui.
        telefone: telefoneToSave ?? "",
        telefone_digits: telefoneDigits ?? "",
        gift_card_id: giftCardId ?? "",
        gift_card_centavos: String(giftCardCentavos),
        gift_card_code: cupomCode ?? "",
        coupon_id: couponId ?? "",
        coupon_code: couponId ? (cupomCode ?? "") : "",
        coupon_discount_centavos: String(couponDiscountCents),
        // Breakdown completo da cobrança — fonte única no metadata
        // pra auditoria. Permite checar a qualquer momento que o
        // valor total bate com unit × quantidade.
        unit_price_centavos: String(breakdown.unitCents),
        subtotal_centavos: String(breakdown.subtotalCents),
        discount_centavos: String(breakdown.discountCents),
        total_after_discount_centavos: String(breakdown.totalCents),
        // Método de pagamento + breakdown de taxa (auditoria/admin).
        payment_method: paymentMethod,
        base_before_fee_centavos: String(baseBeforeFeeCents),
        card_fee_percent_centavos: String(feeInfo.feePercentCents),
        card_fee_fixed_centavos: String(feeInfo.feeFixedCents),
        card_fee_total_centavos: String(feeInfo.feeTotalCents),
        // Fornecedor + financeiro — safety net pro webhook
        // reconciliar caso o pre-insert tenha caído no fallback
        // de colunas ausentes e perdido algum desses campos.
        fornecedor_id: fornecedorId ?? "",
        fornecedor_nome: fornecedorNome ?? "",
        valor_cheio_centavos: valorCheioFinal != null ? String(valorCheioFinal) : "",
        valor_repasse_centavos: valorRepasseCentavos != null ? String(valorRepasseCentavos) : "",
        valor_comissao_centavos: valorComissaoCentavos != null ? String(valorComissaoCentavos) : "",
        variant_label: variantLabel ?? "",
        variant_selected: variantSelected ?? "",
        // Frete (kits) — referência curta pro suporte/reconciliação.
        shipping_service: shippingResolved
          ? (shippingResolved.carrier + " " + shippingResolved.service)
          : "",
        shipping_cost_centavos: shippingCents ? String(shippingCents) : "",
        shipping_cep: shippingInput ? String(shippingInput.cep ?? "") : "",
      },
    });
  } catch (e) {
    console.error("[Elarah Payment] stripe create error", e);
    await refundCupomAplicado();
    await incrementVaga();
    return jsonResponse({ error: "stripe_create_failed" }, 502);
  }

  // Insere booking pending — fonte da verdade local.
  // Importante: o telefone vai tanto no campo dedicado quanto no
  // metadata JSON. Se a coluna `telefone` não existir (migração
  // nova não rodou ainda), a linha é gravada sem ele e o webhook
  // tenta o retry-without-column. O metadata preserva o valor.
  const bookingMetadataBase = {
    bairro: exp.bairro ?? null,
    endereco: exp.endereco ?? null,
    telefone_digits: telefoneDigits || null,
    // Breakdown completo da cobrança — fonte única de auditoria.
    // preco_total_centavos = subtotal (unit × quantidade), antes do
    // desconto e da taxa. Antes era `cents` (unitário), o que era
    // enganoso e mascarava bugs de quantidade. Igualar com create-mp.
    unit_price_centavos: breakdown.unitCents,
    subtotal_centavos: breakdown.subtotalCents,
    discount_centavos: breakdown.discountCents,
    total_after_discount_centavos: breakdown.totalCents,
    preco_total_centavos: breakdown.subtotalCents,
    // Breakdown do pagamento — admin pode usar pra auditar o repasse
    // de taxa. `base_before_fee_centavos` é o valor que cairia no
    // cartão SEM o repasse; `amount_total` na coluna já é o valor
    // final com fee.
    payment_method: paymentMethod,
    base_before_fee_centavos: baseBeforeFeeCents,
    card_fee_percent_centavos: feeInfo.feePercentCents,
    card_fee_fixed_centavos: feeInfo.feeFixedCents,
    card_fee_total_centavos: feeInfo.feeTotalCents,
    // Flag de auditoria: TRUE quando o controle de estoque foi pulado
    // por falha na RPC. Admin pode filtrar por isso pra reconciliar
    // depois de aplicar a migração SQL faltante.
    inventory_skipped: estoquePulado || undefined,
    // Variantes (Pintura → Lagosta/Beijo/Olho grego). Persistidas
    // pra reaparecer no e-mail e no admin. Não afetam o preço.
    variant_label: variantLabel || undefined,
    variant_selected: variantSelected || undefined,
    // Frete + endereço de entrega (kits). Vive no metadata (jsonb) pra
    // o admin ver e despachar — sem depender de migração de colunas.
    shipping: shippingResolved
      ? {
        service: shippingResolved.carrier + " " + shippingResolved.service,
        cost_centavos: shippingCents,
        delivery_days: shippingResolved.delivery_days,
        source: shippingResolved.source,
        destinatario: String(shippingInput?.destinatario ?? ""),
        cpf: String(shippingInput?.cpf ?? "").replace(/\D+/g, ""),
        telefone: String(shippingInput?.telefone ?? "").replace(/\D+/g, ""),
        cep: String(shippingInput?.cep ?? ""),
        logradouro: String(shippingInput?.logradouro ?? ""),
        numero: String(shippingInput?.numero ?? ""),
        complemento: String(shippingInput?.complemento ?? ""),
        bairro: String(shippingInput?.bairro ?? ""),
        cidade: String(shippingInput?.cidade ?? ""),
        uf: String(shippingInput?.uf ?? ""),
        ponto_referencia: String(shippingInput?.ponto_referencia ?? ""),
      }
      : undefined,
  };

  const { error: insertErr } = await supabase.from("bookings").insert({
    user_id: userId,
    email: email ?? "",
    nome: nome,
    telefone: telefoneToSave,
    experiencia_id: exp.id,
    experiencia_nome: exp.nome,
    data: slotRow?.data ?? dataFromPayload ?? exp.data ?? null,
    horario: horario,
    preco_label: exp.preco,
    amount_total: amountToCharge,
    currency: "brl",
    status: "pending",
    stripe_session_id: session.id,
    gift_card_id: giftCardId,
    gift_card_centavos: giftCardCentavos || null,
    gift_card_code: cupomCode,
    coupon_id: couponId,
    coupon_code: couponId ? cupomCode : null,
    coupon_discount_centavos: couponId ? couponDiscountCents : null,
    slot_id: slotId,
    quantidade: quantidade,
    fornecedor_nome: fornecedorNome,
    fornecedor_id: fornecedorId,
    valor_cheio_centavos: valorCheioFinal,
    valor_repasse_centavos: valorRepasseCentavos,
    valor_comissao_centavos: valorComissaoCentavos,
    repasses: repassesArray.length ? repassesArray : null,
    status_fornecedor: "repasse_pendente",
    metadata: { ...bookingMetadataBase, participantes },
  });

  if (insertErr) {
    // Fallback específico: se a coluna `telefone` ainda não existir
    // (migração sql/elarah_bookings_telefone.sql não rodou), o erro
    // vem como "Could not find the 'telefone' column of 'bookings'".
    // Retry sem o campo dedicado — o telefone permanece preservado
    // dentro de metadata.telefone_digits pra reconciliar depois.
    const msg = String(insertErr.message || "").toLowerCase();
    const looksLikeTelefoneMissing =
      msg.includes("telefone") &&
      (msg.includes("column") || msg.includes("schema cache"));
    if (looksLikeTelefoneMissing) {
      console.warn(
        "[create-checkout-session] coluna telefone ausente — retry sem ela (migração sql/elarah_bookings_telefone.sql não rodou)"
      );
      const { error: retryErr } = await supabase.from("bookings").insert({
        user_id: userId,
        email: email ?? "",
        nome: nome,
        experiencia_id: exp.id,
        experiencia_nome: exp.nome,
        data: slotRow?.data ?? dataFromPayload ?? exp.data ?? null,
        horario: horario,
        preco_label: exp.preco,
        amount_total: amountToCharge,
        currency: "brl",
        status: "pending",
        stripe_session_id: session.id,
        gift_card_id: giftCardId,
        gift_card_centavos: giftCardCentavos || null,
        gift_card_code: cupomCode,
        coupon_id: couponId,
        coupon_code: couponId ? cupomCode : null,
        coupon_discount_centavos: couponId ? couponDiscountCents : null,
        slot_id: slotId,
        quantidade: quantidade,
        fornecedor_nome: fornecedorNome,
        fornecedor_id: fornecedorId,
        valor_cheio_centavos: valorCheioFinal,
        valor_repasse_centavos: valorRepasseCentavos,
        valor_comissao_centavos: valorComissaoCentavos,
        repasses: repassesArray.length ? repassesArray : null,
        status_fornecedor: "repasse_pendente",
        metadata: {
          ...bookingMetadataBase,
          telefone: telefoneToSave,
          participantes,
        },
      });
      if (retryErr) {
        console.error(
          "[create-checkout-session] booking retry insert error",
          retryErr
        );
      } else {
        console.info(
          "[create-checkout-session] booking gravada sem coluna telefone (metadata preservou)"
        );
      }
    } else {
      console.error("[create-checkout-session] booking insert error", insertErr);
    }
  } else {
    console.info(
      "[Elarah Payment] booking pending gravada",
      "session=" + session.id,
      "method=" + paymentMethod,
      "base_cents=" + baseBeforeFeeCents,
      "fee_cents=" + feeInfo.feeTotalCents,
      "total_cents=" + amountToCharge,
      "telefone_present=" + (telefoneValid ? "yes" : "no"),
    );
  }

  return jsonResponse({
    url: session.url,
    session_id: session.id,
    payment_method: paymentMethod,
    base_before_fee_centavos: baseBeforeFeeCents,
    card_fee_total_centavos: feeInfo.feeTotalCents,
    amount_total_centavos: amountToCharge,
  });
}

// =============================================================
// ENTRY
// =============================================================
serve(async (req) => {
  // Marcador no boot. Aparece nos logs do Supabase em CADA invocação,
  // confirmando qual versão da função está atendendo a request. Se
  // este log NÃO aparece quando o checkout é tentado, o deploy não
  // chegou — a função antiga ainda está sendo servida (cache, projeto
  // errado, build antigo). Diagnóstico imediato pelo log.
  console.info(
    "[Elarah Payment] create-checkout-session BOOT",
    "version=" + CHECKOUT_FN_VERSION,
    "method=" + req.method,
  );

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[create-checkout-session] missing env vars");
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const mode = String(payload.mode ?? "experience");

  // Modo leve: devolve as taxas do cartão pro frontend exibir o
  // breakdown antes do checkout. Não cria booking, não chama Stripe.
  // Fonte da verdade das taxas pra que o preview no modal de
  // reserva case com o que o backend realmente cobra.
  if (mode === "fee_config") {
    return jsonResponse({
      card_fee_percent: CARD_FEE_PERCENT,
      card_fee_fixed_cents: CARD_FEE_FIXED_CENTS,
    });
  }

  // ===== Wrapper de exceção =====
  // Defesa final: se QUALQUER coisa lançar exceção dentro dos handlers
  // (RPC indisponível, schema desatualizado, lib quebrada, etc.), a
  // gente captura aqui e devolve 500 com um erro NOMEADO — nunca
  // `vagas_check_failed`, nunca o stack trace cru. Garante que o
  // checkout não trava por bugs de infraestrutura inesperados.
  try {
    if (mode === "gift_card") {
      return await handleGiftCardPurchase(payload);
    }
    return await handleExperienceCheckout(payload);
  } catch (e) {
    console.error(
      "[Elarah Payment] EXCEPTION inesperada — checkout abortado",
      "version=" + CHECKOUT_FN_VERSION,
      "mode=" + mode,
      "error=" + (e instanceof Error ? e.message : String(e)),
      "stack=" + (e instanceof Error ? e.stack : "(no stack)"),
    );
    return jsonResponse(
      {
        error: "checkout_unexpected_error",
        message:
          "Erro inesperado no checkout. Tente novamente em instantes ou " +
          "entre em contato pelo WhatsApp.",
      },
      500,
    );
  }
});
