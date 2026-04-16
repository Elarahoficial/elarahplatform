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
const CARD_FEE_PERCENT = Number(Deno.env.get("CARD_FEE_PERCENT") ?? "0");
const CARD_FEE_FIXED_CENTS = Number(Deno.env.get("CARD_FEE_FIXED_CENTS") ?? "0");

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
  const feeTotalCents = feePercentCents + feeFixedCents;
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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// "R$ 1.234,50" / "R$383" / "383,00" -> 38300 (centavos)
function parsePrecoToCents(raw: unknown): number | null {
  if (raw == null) return null;
  const text = String(raw).replace(/\s/g, "").replace(/^R\$/i, "");
  if (!text) return null;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
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
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
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
async function handleExperienceCheckout(payload: Record<string, unknown>) {
  const experienciaId = String(payload.experiencia_id ?? "").trim();
  const horario = payload.horario ? String(payload.horario).trim() : null;
  const email = payload.email ? String(payload.email).trim() : null;
  const nomeFromPayload = payload.nome ? String(payload.nome).trim() : null;
  const cupomCode = payload.cupom ? String(payload.cupom).trim() : null;
  const quantidade = Math.max(1, Math.floor(Number(payload.quantidade) || 1));
  const participantes = Array.isArray(payload.participantes) ? payload.participantes : [];

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
      "id, nome, preco, data, horario, horarios, endereco, bairro, vagas_total, vagas_restantes, event_at, cutoff_hours, is_active",
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

  // ===== Slot lookup (vagas por horário) =====
  // Se existe um slot para este (experience_id, horario), usamos
  // vagas do slot. Senão, fallback pro experience-level.
  let slotId: string | null = null;
  let useSlotVagas = false;
  // deno-lint-ignore no-explicit-any
  let slotRow: any = null;

  if (horario) {
    const { data: sr } = await supabase
      .from("experience_slots")
      .select("id, vagas_total, vagas_restantes, event_at, is_active")
      .eq("experience_id", exp.id)
      .eq("horario", horario)
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

  const cents = parsePrecoToCents(exp.preco);
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

  // ===== Hold gift card (se cupom enviado) =====
  let giftCardId: string | null = null;
  let giftCardCentavos = 0;
  let amountToCharge = cents;

  if (cupomCode) {
    const { data: holdRows, error: holdErr } = await supabase.rpc(
      "hold_gift_card",
      { p_code: cupomCode, p_amount_centavos: cents },
    );
    if (holdErr) {
      console.error("[create-checkout-session] hold error", holdErr);
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
    amountToCharge = Math.max(0, cents - giftCardCentavos);
  }

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

  // ===== Decremento atômico de vaga =====
  // Só agora — depois do hold do cupom — pra evitar reservar vaga
  // que vamos liberar logo em seguida se o cupom falhar.
  // Usa slot-level se disponível, senão experience-level.
  const decrementRpc = useSlotVagas ? "decrement_slot_vagas" : "decrement_experience_vagas";
  const decrementArg = useSlotVagas
    ? { p_slot_id: slotId, p_qty: quantidade }
    : { p_experience_id: exp.id, p_qty: quantidade };

  const { data: vagaRows, error: vagaErr } = await supabase.rpc(
    decrementRpc,
    decrementArg,
  );
  if (vagaErr) {
    console.error("[create-checkout-session] vagas decrement error", vagaErr);
    if (giftCardId) {
      await supabase.rpc("refund_gift_card", {
        p_gift_card_id: giftCardId,
        p_amount_centavos: giftCardCentavos,
      });
    }
    return jsonResponse({ error: "vagas_check_failed" }, 500);
  }
  const vagaRow = Array.isArray(vagaRows) ? vagaRows[0] : vagaRows;
  if (!vagaRow || vagaRow.ok === false) {
    if (giftCardId) {
      await supabase.rpc("refund_gift_card", {
        p_gift_card_id: giftCardId,
        p_amount_centavos: giftCardCentavos,
      });
    }
    const soldOutMsg = useSlotVagas
      ? "Este horário está esgotado."
      : "Esta experiência está esgotada.";
    return jsonResponse(
      {
        error: useSlotVagas ? "slot_sold_out" : "experience_sold_out",
        message: soldOutMsg,
      },
      409,
    );
  }

  // Helper pra rollback de vaga — slot ou experiência
  const incrementVaga = async () => {
    if (useSlotVagas) {
      await supabase.rpc("increment_slot_vagas", { p_slot_id: slotId, p_qty: quantidade });
    } else {
      await supabase.rpc("increment_experience_vagas", { p_experience_id: exp.id, p_qty: quantidade });
    }
  };

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
      data: exp.data ?? null,
      horario: horario,
      preco_label: exp.preco,
      amount_total: 0,
      currency: "brl",
      status: "pago",
      stripe_session_id: "GIFT-" + directBookingId.slice(0, 12),
      gift_card_id: giftCardId,
      gift_card_centavos: giftCardCentavos,
      gift_card_code: cupomCode,
      slot_id: slotId,
      quantidade: quantidade,
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
      if (giftCardId) {
        await supabase.rpc("refund_gift_card", {
          p_gift_card_id: giftCardId,
          p_amount_centavos: giftCardCentavos,
        });
      }
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
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      locale: "pt-BR",
      customer_email: email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: amountToCharge,
            product_data: {
              name: productName,
              description: [exp.data, horario, exp.bairro]
                .filter(Boolean)
                .join(" · ")
                .slice(0, 380),
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        kind: "experience",
        experiencia_id: exp.id,
        experiencia_nome: exp.nome,
        data: exp.data ?? "",
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
        // Método de pagamento + breakdown de taxa (auditoria/admin).
        payment_method: paymentMethod,
        base_before_fee_centavos: String(baseBeforeFeeCents),
        card_fee_percent_centavos: String(feeInfo.feePercentCents),
        card_fee_fixed_centavos: String(feeInfo.feeFixedCents),
        card_fee_total_centavos: String(feeInfo.feeTotalCents),
      },
    });
  } catch (e) {
    console.error("[Elarah Payment] stripe create error", e);
    if (giftCardId) {
      await supabase.rpc("refund_gift_card", {
        p_gift_card_id: giftCardId,
        p_amount_centavos: giftCardCentavos,
      });
    }
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
    preco_total_centavos: cents,
    // Breakdown do pagamento — admin pode usar pra auditar o repasse
    // de taxa. `base_before_fee_centavos` é o valor que cairia no
    // cartão SEM o repasse; `amount_total` na coluna já é o valor
    // final com fee.
    payment_method: paymentMethod,
    base_before_fee_centavos: baseBeforeFeeCents,
    card_fee_percent_centavos: feeInfo.feePercentCents,
    card_fee_fixed_centavos: feeInfo.feeFixedCents,
    card_fee_total_centavos: feeInfo.feeTotalCents,
  };

  const { error: insertErr } = await supabase.from("bookings").insert({
    user_id: userId,
    email: email ?? "",
    nome: nome,
    telefone: telefoneToSave,
    experiencia_id: exp.id,
    experiencia_nome: exp.nome,
    data: exp.data ?? null,
    horario: horario,
    preco_label: exp.preco,
    amount_total: amountToCharge,
    currency: "brl",
    status: "pending",
    stripe_session_id: session.id,
    gift_card_id: giftCardId,
    gift_card_centavos: giftCardCentavos || null,
    gift_card_code: cupomCode,
    slot_id: slotId,
    quantidade: quantidade,
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
        data: exp.data ?? null,
        horario: horario,
        preco_label: exp.preco,
        amount_total: amountToCharge,
        currency: "brl",
        status: "pending",
        stripe_session_id: session.id,
        gift_card_id: giftCardId,
        gift_card_centavos: giftCardCentavos || null,
        gift_card_code: cupomCode,
        metadata: {
          ...bookingMetadataBase,
          telefone: telefoneToSave,
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

  if (mode === "gift_card") {
    return handleGiftCardPurchase(payload);
  }
  return handleExperienceCheckout(payload);
});
