// =============================================================
// ELARAH — create-mp-pix-payment Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-mp-pix-payment
//
// Cria um pagamento PIX via Mercado Pago e pre-grava a booking
// em status='pending'. Devolve pro frontend o QR code + código
// copia-e-cola pra ser exibido inline no modal.
//
// Diferente do Stripe (redirect), aqui o usuário nunca sai do site.
// O polling do frontend + o mp-webhook cuidam da confirmação.
//
// Payload esperado:
//   {
//     "experiencia_id": "uuid",
//     "horario":        "19h00 – 22h30",
//     "email":          "cliente@dominio",
//     "nome":           "Maria Silva",
//     "cpf":            "12345678900",        // só dígitos
//     "telefone":       "(11) 91234-5678",
//     "telefone_digits":"11912345678",
//     "cupom":          "ELRH-..." | null
//   }
//
// Respostas:
//   200 { booking_id, payment_id, qr_code, qr_code_base64,
//         expires_at, amount_total_centavos, direct?: true }
//   4xx { error, message }
//   502 { error: "mp_create_failed", detail }
//
// Variáveis de ambiente:
//   MERCADO_PAGO_ACCESS_TOKEN
//   MERCADO_PAGO_WEBHOOK_SECRET  (usada no webhook, não aqui, mas
//                                  o front pode consultar este
//                                  endpoint sem ela)
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   PUBLIC_SITE_URL              (usada pra montar a notification_url)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { sendDirectBookingConfirmation } from "../_shared/email.ts";
import { buildAcompanhantes } from "../_shared/acompanhantes.ts";
import {
  createPixPayment,
  isValidCpf,
} from "../_shared/mercadopago.ts";
import {
  reserveExperienceSlot,
  computeChargeAmount,
  assertExpectedTotal,
} from "../_shared/booking_guard.ts";
import {
  computeFinancialBreakdown,
  type SupplierRow,
} from "../_shared/financial.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (MP_ACCESS_TOKEN && MP_ACCESS_TOKEN.startsWith("TEST-")) {
  console.warn(
    "[Elarah Payment/MP] ⚠ MERCADO_PAGO_ACCESS_TOKEN é de TESTE (TEST-…). " +
      "PIX pode falhar se a conta de teste não tiver chave PIX cadastrada.",
  );
}

const PUBLIC_SITE_URL =
  (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/+$/, "") ||
  "https://elarah.com.br";

// Notification URL é a URL pública da nossa função mp-webhook.
// Supabase Edge Functions sempre estão em
// https://<project>.supabase.co/functions/v1/<name>
function buildMpNotificationUrl(): string | undefined {
  if (!SUPABASE_URL) return undefined;
  return SUPABASE_URL.replace(/\/+$/, "") + "/functions/v1/mp-webhook";
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Divide "Maria Silva de Souza" em {first="Maria", last="Silva de Souza"}.
// MP exige os dois separados; se só tem 1 palavra, duplica.
function splitName(fullName: string): { first: string; last: string } {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Cliente", last: "Elarah" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

// Telefone BR (só dígitos) → { areaCode, number } pro payer.phone.
function splitPhone(digitsRaw: string | null): { areaCode: string; number: string } | undefined {
  const d = String(digitsRaw || "").replace(/\D+/g, "");
  if (d.length < 10) return undefined;
  return { areaCode: d.slice(0, 2), number: d.slice(2) };
}

// Marcador único de versão. Mude a cada release pra confirmar via logs
// do Supabase qual versão está rodando. Se você ver esse marcador nos
// logs ao testar uma reserva, o deploy passou e o código novo está ativo.
const PIX_FN_VERSION = "v5-variant-price-guard-2026-07-25";

// =============================================================
// MODO B — gift card via PIX (Mercado Pago)
// -------------------------------------------------------------
// Espelha o handleGiftCardPurchase de create-checkout-session, mas
// gera PIX em vez de redirecionar pra Stripe Checkout. O frontend
// recebe o QR + payment_id e exibe inline (igual fluxo de
// experiência via PIX). Quando a MP confirmar, mp-webhook detecta
// que o external_reference começa com "GIFT-" e dispara a ativação
// do gift_card (gera código, atualiza status, manda os e-mails).
//
// Pre-grava em gift_cards com status='pending' antes de bater na
// MP — mesmo princípio do Stripe: se o pre-insert falhar, aborta
// pra não criar pagamento órfão sem rastro no banco.
// =============================================================
async function handleGiftCardPixRequest(
  payload: Record<string, unknown>,
): Promise<Response> {
  const valor = Number(payload.gift_card_value_centavos ?? 0);
  const buyerEmail = String(payload.buyer_email ?? "").trim();
  const buyerNome = String(payload.buyer_nome ?? "").trim();
  const recipientEmail = String(payload.recipient_email ?? "").trim();
  const recipientNome = String(payload.recipient_nome ?? "").trim();
  const mensagem = String(payload.mensagem ?? "").trim();
  const cpfRaw = String(payload.cpf ?? "").replace(/\D+/g, "");

  if (!Number.isFinite(valor) || valor < 5000) {
    return jsonResponse({ error: "gift_card_min_value" }, 400);
  }
  if (valor > 500000) {
    return jsonResponse({ error: "gift_card_max_value" }, 400);
  }
  if (!recipientEmail || !/.+@.+\..+/.test(recipientEmail)) {
    return jsonResponse({ error: "recipient_email_required" }, 400);
  }
  // PIX exige e-mail E CPF do pagador (regra MP). Stripe não exige
  // — daí a divergência de validações entre os dois modos.
  if (!buyerEmail || !/.+@.+\..+/.test(buyerEmail)) {
    return jsonResponse(
      {
        error: "buyer_email_required",
        message:
          "Informe seu e-mail — exigido pela Mercado Pago pra gerar o PIX.",
      },
      400,
    );
  }
  if (!isValidCpf(cpfRaw)) {
    return jsonResponse(
      {
        error: "cpf_required",
        message: "CPF inválido. PIX via Mercado Pago exige CPF válido.",
      },
      400,
    );
  }

  // Resolve user_id do comprador (opcional, igual Stripe)
  let buyerUserId: string | null = null;
  if (buyerEmail) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", buyerEmail)
      .maybeSingle();
    if (prof) buyerUserId = (prof as { id?: string }).id ?? null;
  }

  // Gera id antecipado pra usar como external_reference (com prefixo
  // "GIFT-" pra o webhook reconhecer que é gift card e não booking).
  const giftCardId = crypto.randomUUID();
  const externalReference = "GIFT-" + giftCardId;
  const sessionPlaceholder = "MP-GIFT-" + giftCardId;

  // Pré-grava gift_card como pending — se o webhook não rodar por
  // qualquer motivo, o admin ainda vê a tentativa no banco. Status
  // 'pending' impede uso prematuro do código.
  const giftCardRow = {
    id: giftCardId,
    code: "PENDING-MP-" + giftCardId.slice(-12).toUpperCase(),
    valor_inicial_centavos: valor,
    saldo_centavos: valor,
    status: "pending",
    comprador_user_id: buyerUserId,
    comprador_email: buyerEmail || null,
    comprador_nome: buyerNome || null,
    destinatario_email: recipientEmail,
    destinatario_nome: recipientNome || null,
    mensagem: mensagem || null,
    stripe_session_id: sessionPlaceholder,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      payment_method: "pix",
      payment_provider: "mercado_pago",
      cpf: cpfRaw,
    },
  };

  const { error: insertErr } = await supabase
    .from("gift_cards")
    .insert(giftCardRow);

  if (insertErr) {
    console.error(
      "[Elarah Payment/MP gift] FALHA CRÍTICA ao pré-gravar gift card",
      "error=" + JSON.stringify(insertErr),
    );
    return jsonResponse(
      {
        error: "gift_card_save_failed",
        message:
          "Não foi possível registrar o gift card antes do pagamento. " +
          "Detalhe: " + (insertErr.message || "erro desconhecido"),
        hint:
          "Verifique se a migration sql/elarah_extensions.sql foi executada " +
          "no Supabase e se a tabela public.gift_cards existe.",
        detail: insertErr,
      },
      500,
    );
  }

  // Cria PIX na MP com external_reference="GIFT-<uuid>" — o webhook
  // mp-webhook usa esse prefixo pra rotear pra ativação de gift card
  // em vez do fluxo de booking.
  const { first: firstName, last: lastName } = splitName(
    buyerNome || "Cliente Elarah",
  );

  const giftDescription = ("Gift Card Elarah para " +
    (recipientNome || recipientEmail)).slice(0, 250);
  const mpResult = await createPixPayment(MP_ACCESS_TOKEN, {
    transactionAmountCents: valor,
    description: giftDescription,
    externalReference: externalReference,
    payerEmail: buyerEmail,
    payerFirstName: firstName,
    payerLastName: lastName,
    payerCpf: cpfRaw,
    expiresInMinutes: 30,
    notificationUrl: buildMpNotificationUrl(),
    idempotencyKey: giftCardId,
    // Device ID + additional_info (boas práticas de aprovação).
    deviceId: payload.device_id ? String(payload.device_id).trim() : undefined,
    items: [{
      id: giftCardId,
      title: "Gift Card Elarah",
      description: giftDescription,
      categoryId: "gift_cards",
      quantity: 1,
      unitPriceCents: valor,
    }],
  });

  if (!mpResult.ok || !mpResult.payment) {
    console.error(
      "[Elarah Payment/MP gift] MP retornou erro, cancelando pre-insert",
      "status=" + mpResult.errorStatus,
      "body=" + JSON.stringify(mpResult.errorBody),
    );
    // Cancela o gift_card pra não ficar pending órfão.
    await supabase
      .from("gift_cards")
      .update({ status: "cancelled" })
      .eq("id", giftCardId);
    return jsonResponse(
      {
        error: "mp_create_failed",
        message:
          "Não foi possível gerar o PIX. Tente novamente ou pague no cartão.",
        detail: mpResult.errorBody,
      },
      502,
    );
  }

  const payment = mpResult.payment;
  const qrCode =
    payment.point_of_interaction?.transaction_data?.qr_code ?? null;
  const qrCodeBase64 =
    payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;
  const ticketUrl =
    payment.point_of_interaction?.transaction_data?.ticket_url ?? null;

  if (!qrCode || !qrCodeBase64) {
    if (!ticketUrl) {
      console.error(
        "[Elarah Payment/MP gift] resposta sem QR nem ticket_url",
        JSON.stringify(payment),
      );
      await supabase
        .from("gift_cards")
        .update({ status: "cancelled" })
        .eq("id", giftCardId);
      return jsonResponse(
        { error: "mp_qr_missing", message: "MP respondeu sem QR code." },
        502,
      );
    }
  }

  // Atualiza metadata com mp_payment_id (pro check-mp-payment-status
  // poder reconciliar via id depois) e expiração.
  await supabase
    .from("gift_cards")
    .update({
      metadata: {
        payment_method: "pix",
        payment_provider: "mercado_pago",
        cpf: cpfRaw,
        mp_payment_id: String(payment.id),
        mp_expires_at: payment.date_of_expiration,
      },
    })
    .eq("id", giftCardId);

  console.info(
    "[Elarah Payment/MP gift] gift card pre-saved + QR gerado",
    "gift_card_id=" + giftCardId,
    "mp_payment=" + payment.id,
    "valor_centavos=" + valor,
  );

  return jsonResponse({
    gift_card_id: giftCardId,
    payment_id: String(payment.id),
    qr_code: qrCode,
    qr_code_base64: qrCodeBase64,
    ticket_url: ticketUrl,
    expires_at: payment.date_of_expiration,
    amount_total_centavos: valor,
  });
}

async function handlePixRequest(payload: Record<string, unknown>): Promise<Response> {
  // ===== Parse do payload =====
  const experienciaId = String(payload.experiencia_id ?? "").trim();
  const horario = payload.horario ? String(payload.horario).trim() : null;
  const dataFromPayload = payload.data ? String(payload.data).trim() : null;
  const slotIdFromPayload = payload.slot_id ? String(payload.slot_id).trim() : null;
  const email = payload.email ? String(payload.email).trim() : null;
  const nomeFromPayload = payload.nome ? String(payload.nome).trim() : null;
  const cupomCode = payload.cupom ? String(payload.cupom).trim() : null;
  const cpfRaw = String(payload.cpf ?? "").replace(/\D+/g, "");
  const quantidade = Math.max(1, Math.floor(Number(payload.quantidade) || 1));
  const participantes = Array.isArray(payload.participantes) ? payload.participantes : [];
  // Acompanhantes → coluna dedicada `acompanhantes` (jsonb) da tabela bookings.
  // Formato: [{ nome, telefone }] com telefone só em dígitos (DDD + número).
  // Usa o array explícito enviado pelo checkout; se ausente, deriva de
  // `participantes` (índice 0 = titular/comprador; 1..N = acompanhantes).
  const acompanhantes = buildAcompanhantes(payload, participantes);
  // Variantes (Pintura → Lagosta/Beijo/Olho grego). Persistidas em
  // metadata.variant_label + metadata.variant_selected. Não afetam preço.
  const variantLabel = payload.variant_label ? String(payload.variant_label).trim() : null;
  const variantSelected = payload.variant_selected ? String(payload.variant_selected).trim() : null;
  // Preço unitário da variação exibido no front (centavos). Só dica de
  // segurança — o banco continua autoritativo. Ver booking_guard §5b.
  const variantExpectedCents = (function () {
    const n = Number(payload.variant_price_expected_centavos);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  })();

  const telefoneHuman = payload.telefone
    ? String(payload.telefone).trim()
    : null;
  const telefoneDigits = payload.telefone_digits
    ? String(payload.telefone_digits).replace(/\D+/g, "")
    : (telefoneHuman ? telefoneHuman.replace(/\D+/g, "") : null);
  const telefoneValid =
    telefoneDigits && telefoneDigits.length >= 10 && telefoneDigits.length <= 13;
  const telefoneToSave = telefoneValid
    ? (telefoneHuman || telefoneDigits)
    : (telefoneHuman || null);

  // ===== Validações básicas =====
  if (!experienciaId) {
    return jsonResponse({ error: "experiencia_id_required" }, 400);
  }
  if (!email || !/.+@.+\..+/.test(email)) {
    return jsonResponse(
      { error: "email_required", message: "E-mail é obrigatório pra PIX." },
      400,
    );
  }
  if (!isValidCpf(cpfRaw)) {
    return jsonResponse(
      {
        error: "cpf_required",
        message: "CPF inválido. Use 11 dígitos — PIX via Mercado Pago exige CPF.",
      },
      400,
    );
  }

  // ===== Reserva slot (valida exp, decrementa vaga, hold cupom) =====
  const guard = await reserveExperienceSlot(supabase, {
    experienciaId,
    horario,
    data: dataFromPayload,
    slotId: slotIdFromPayload,
    email,
    nome: nomeFromPayload,
    cupomCode,
    quantidade,
    variantSelected,
    variantExpectedCents,
  });

  if (!guard.ok) {
    console.warn(
      "[Elarah Payment/MP] guard rejeitou",
      "code=" + guard.errorCode,
      "exp=" + experienciaId,
    );
    return jsonResponse(
      { error: guard.errorCode, message: guard.errorMessage },
      guard.errorStatus,
    );
  }

  const {
    exp,
    userId,
    resolvedNome,
    baseCents,
    giftCardId,
    giftCardCentavos,
    couponId,
    couponDiscountCents,
    amountToChargeCents,
    slotId,
    slotData,
    quantidade: guardQty,
    fornecedorId,
    fornecedorNome,
    valorCheioCentavos,
    percentualRepasse,
    valorRepasseFixoCentavos,
    inventorySkipped,
    rollback,
  } = guard;

  // ===== Cálculo financeiro (mapa de divisão) =====
  // Usa experience_suppliers (modelo novo, 1:N). Fallback automático
  // pra experience.fornecedor_nome + percentual_repasse legado.
  const valorCheioFinal = valorCheioCentavos ? valorCheioCentavos * guardQty : null;

  let suppliers: SupplierRow[] = [];
  try {
    const { data: supRows, error: supErr } = await supabase
      .from("experience_suppliers")
      .select("fornecedor_nome, share_type, share_value, ordem, notas")
      .eq("experience_id", exp.id)
      .order("ordem", { ascending: true });
    if (supErr) {
      console.warn(
        "[Elarah Payment/MP] experience_suppliers lookup falhou — fallback no legado",
        supErr.message,
      );
    } else if (Array.isArray(supRows)) {
      suppliers = supRows as SupplierRow[];
    }
  } catch (e) {
    console.warn("[Elarah Payment/MP] experience_suppliers exception", e);
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
          percentualRepasse: percentualRepasse,
          // Multiplica × qty: shared trata o fixo legado como total.
          valorRepasseFixoCentavos: valorRepasseFixoCentavos != null
            ? Number(valorRepasseFixoCentavos) * guardQty
            : null,
        },
      )
    : null;

  const valorRepasseCentavos = breakdownFin ? breakdownFin.totalRepasseCentavos : null;
  const valorComissaoCentavos = breakdownFin ? breakdownFin.comissaoCentavos : null;
  const repassesArray = breakdownFin ? breakdownFin.repasses : [];

  if (breakdownFin) {
    console.info(
      "[Elarah Payment/MP] mapa financeiro",
      "valor_cheio=" + valorCheioFinal,
      "n_suppliers=" + repassesArray.length,
      "total_repasse=" + valorRepasseCentavos,
      "comissao=" + valorComissaoCentavos,
      "legacy_fallback=" + (breakdownFin.usedLegacyFallback ? "yes" : "no"),
    );
  }

  // ===== CASO especial: cupom cobre 100% — pula MP =====
  // Fluxo idêntico ao que create-checkout-session faz: grava direto
  // como pago, nenhum pagamento é criado na MP.
  if (amountToChargeCents === 0) {
    const directBookingId = crypto.randomUUID();
    // A reserva vira `pago` aqui mesmo (gift card cobre 100%), então o
    // webhook do provedor NUNCA dispara — e era ele que mandava a
    // confirmação. Guardamos a linha pra mandar o e-mail logo abaixo.
    const directRow = {
      id: directBookingId,
      user_id: userId,
      email: email,
      nome: resolvedNome,
      telefone: telefoneToSave,
      experiencia_id: exp.id,
      experiencia_nome: exp.nome,
      data: slotData ?? dataFromPayload ?? exp.data ?? null,
      horario: horario,
      preco_label: exp.preco,
      amount_total: 0,
      currency: "brl",
      status: "pago",
      stripe_session_id: "MP-GIFT-" + directBookingId.slice(0, 12),
      gift_card_id: giftCardId,
      gift_card_centavos: giftCardCentavos,
      gift_card_code: cupomCode,
      coupon_id: couponId,
      coupon_code: couponId ? cupomCode : null,
      coupon_discount_centavos: couponId ? couponDiscountCents : null,
      slot_id: slotId,
      quantidade: guardQty,
      fornecedor_nome: fornecedorNome,
      fornecedor_id: fornecedorId,
      valor_cheio_centavos: valorCheioFinal,
      valor_repasse_centavos: valorRepasseCentavos,
      valor_comissao_centavos: valorComissaoCentavos,
      repasses: repassesArray.length ? repassesArray : null,
      status_fornecedor: "repasse_pendente",
      payment_provider: "mercado_pago",
      acompanhantes: acompanhantes,
      metadata: {
        bairro: exp.bairro ?? null,
        endereco: exp.endereco ?? null,
        paid_with_gift_card_only: true,
        participantes: participantes,
        telefone_digits: telefoneDigits || null,
        payment_method: "pix",
        cpf: cpfRaw,
      },
    };
    const { error: directErr } = await supabase.from("bookings").insert(directRow);

    if (directErr) {
      console.error("[Elarah Payment/MP] direct booking insert falhou", directErr);
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }

    console.info(
      "[Elarah Payment/MP] booking gratuita via cupom 100%",
      "booking=" + directBookingId,
    );
    // Confirmação pro cliente + aviso de venda pra Elarah. Não lança:
    // a reserva já está gravada, e-mail que falha não pode derrubar o checkout.
    await sendDirectBookingConfirmation(directRow);
    return jsonResponse({
      direct: true,
      booking_id: directBookingId,
      paid_with_gift_card: true,
      gift_card_centavos: giftCardCentavos,
    });
  }

  // ===== Caso normal: criar pagamento PIX na MP =====
  // Reserva booking_id ANTES de chamar a MP pra poder usar como
  // external_reference — facilita reconciliação.
  const bookingId = crypto.randomUUID();
  const { first: firstName, last: lastName } = splitName(resolvedNome || "Cliente Elarah");

  // Sanity check final antes de chamar a MP. Mesmo o booking_guard
  // já tendo calculado tudo, a checagem explícita serve de defesa
  // contra qualquer regressão futura — nunca cobramos a menos.
  const breakdown = computeChargeAmount(baseCents, guardQty, giftCardCentavos);
  try {
    assertExpectedTotal(breakdown, amountToChargeCents, "mp pix payment");
  } catch (e) {
    console.error("[Elarah Payment/MP] assertExpectedTotal falhou", e);
    await rollback();
    return jsonResponse(
      { error: "amount_mismatch", message: "Erro interno no cálculo do total. Recarregue e tente novamente." },
      500,
    );
  }

  console.info(
    "[Elarah Payment/MP] QUANTIDADE DEBUG",
    "payload.quantidade=" + payload.quantidade,
    "guardQty=" + guardQty,
    "baseCents=" + baseCents,
    "subtotal=" + breakdown.subtotalCents,
    "discount=" + breakdown.discountCents,
    "amountToChargeCents=" + amountToChargeCents,
    "giftCardCentavos=" + giftCardCentavos,
  );

  const pixDescription = [exp.nome, exp.data, horario].filter(Boolean).join(" · ").slice(0, 250);
  const mpResult = await createPixPayment(MP_ACCESS_TOKEN, {
    transactionAmountCents: amountToChargeCents,
    description: pixDescription,
    externalReference: bookingId,
    payerEmail: email,
    payerFirstName: firstName,
    payerLastName: lastName,
    payerCpf: cpfRaw,
    expiresInMinutes: 30,
    notificationUrl: buildMpNotificationUrl(),
    idempotencyKey: bookingId,
    // ===== Boas práticas de aprovação (Device ID + additional_info) =====
    deviceId: payload.device_id ? String(payload.device_id).trim() : undefined,
    payerPhone: splitPhone(telefoneDigits),
    items: [{
      id: bookingId,
      title: String(exp.nome).slice(0, 250),
      description: pixDescription,
      categoryId: "entertainment",
      quantity: 1,
      unitPriceCents: amountToChargeCents,
    }],
  });

  if (!mpResult.ok || !mpResult.payment) {
    console.error(
      "[Elarah Payment/MP] MP retornou erro, fazendo rollback",
      "status=" + mpResult.errorStatus,
      "body=" + JSON.stringify(mpResult.errorBody),
    );
    await rollback();
    return jsonResponse(
      {
        error: "mp_create_failed",
        message: "Não foi possível gerar o PIX. Tente novamente ou pague no cartão.",
        detail: mpResult.errorBody,
      },
      502,
    );
  }

  const payment = mpResult.payment;
  const qrCode = payment.point_of_interaction?.transaction_data?.qr_code ?? null;
  const qrCodeBase64 =
    payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;
  const ticketUrl =
    payment.point_of_interaction?.transaction_data?.ticket_url ?? null;

  if (!qrCode || !qrCodeBase64) {
    // Fallback: se a MP devolveu ticket_url mas não QR inline, usamos
    // a página hospedada pela MP pra exibir o PIX pro usuário.
    if (ticketUrl) {
      console.warn(
        "[Elarah Payment/MP] QR inline ausente, usando ticket_url fallback",
        "mp_payment=" + payment.id,
        "ticket_url=" + ticketUrl,
      );
    } else {
      console.error(
        "[Elarah Payment/MP] resposta sem QR code nem ticket_url",
        JSON.stringify(payment),
      );
      await rollback();
      return jsonResponse(
        {
          error: "mp_qr_missing",
          message: "MP respondeu sem QR code.",
        },
        502,
      );
    }
  }

  // ===== Grava booking pending =====
  const bookingMetadata = {
    bairro: exp.bairro ?? null,
    endereco: exp.endereco ?? null,
    telefone_digits: telefoneDigits || null,
    // Breakdown pra auditoria — fonte única do guard.
    unit_price_centavos: breakdown.unitCents,
    subtotal_centavos: breakdown.subtotalCents,
    discount_centavos: breakdown.discountCents,
    total_after_discount_centavos: breakdown.totalCents,
    // preco_total_centavos sempre = subtotal (unit × quantidade).
    // Antes era baseCents, que é unitário — campo era enganoso.
    preco_total_centavos: breakdown.subtotalCents,
    payment_method: "pix",
    payment_provider: "mercado_pago",
    cpf: cpfRaw,
    mp_payment_id: String(payment.id),
    mp_expires_at: payment.date_of_expiration,
    // Flag de auditoria: TRUE se o RPC de vagas falhou e o pagamento
    // prosseguiu sem decrementar estoque (fallback de emergência).
    inventory_skipped: inventorySkipped || undefined,
    // Variantes (escolha extra do cliente, ex.: Pintura → Lagosta).
    variant_label: variantLabel || undefined,
    variant_selected: variantSelected || undefined,
  };

  // stripe_session_id é UNIQUE na tabela — como PIX não tem session
  // Stripe, usamos um prefixo "MP-<payment_id>" pra caber no unique
  // constraint sem colidir com sessões reais do Stripe.
  const stripeSessionIdPlaceholder = "MP-" + payment.id;

  const { error: insertErr } = await supabase.from("bookings").insert({
    id: bookingId,
    user_id: userId,
    email: email,
    nome: resolvedNome,
    telefone: telefoneToSave,
    experiencia_id: exp.id,
    experiencia_nome: exp.nome,
    data: slotData ?? dataFromPayload ?? exp.data ?? null,
    horario: horario,
    preco_label: exp.preco,
    amount_total: amountToChargeCents,
    currency: "brl",
    status: "pending",
    stripe_session_id: stripeSessionIdPlaceholder,
    gift_card_id: giftCardId,
    gift_card_centavos: giftCardCentavos || null,
    gift_card_code: cupomCode,
    coupon_id: couponId,
    coupon_code: couponId ? cupomCode : null,
    coupon_discount_centavos: couponId ? couponDiscountCents : null,
    slot_id: slotId,
    quantidade: guardQty,
    fornecedor_nome: fornecedorNome,
    fornecedor_id: fornecedorId,
    status_fornecedor: "repasse_pendente",
    mp_payment_id: String(payment.id),
    payment_provider: "mercado_pago",
    acompanhantes: acompanhantes,
    metadata: { ...bookingMetadata, participantes },
  });

  if (insertErr) {
    // Fallback: se as colunas novas (mp_payment_id / payment_provider)
    // ainda não foram criadas, tenta sem elas. O metadata preserva o
    // payment_id pro webhook reconciliar.
    const msg = String(insertErr.message || "").toLowerCase();
    const looksLikeNewColumnsMissing =
      (msg.includes("mp_payment_id") || msg.includes("payment_provider")) &&
      (msg.includes("column") || msg.includes("schema cache"));
    if (looksLikeNewColumnsMissing) {
      console.warn(
        "[Elarah Payment/MP] coluna mp_payment_id/payment_provider ausente — retry sem elas",
        "(rode sql/elarah_bookings_mp.sql no Supabase)",
      );
      const { error: retryErr } = await supabase.from("bookings").insert({
        id: bookingId,
        user_id: userId,
        email: email,
        nome: resolvedNome,
        telefone: telefoneToSave,
        experiencia_id: exp.id,
        experiencia_nome: exp.nome,
        data: slotData ?? dataFromPayload ?? exp.data ?? null,
        horario: horario,
        preco_label: exp.preco,
        amount_total: amountToChargeCents,
        currency: "brl",
        status: "pending",
        stripe_session_id: stripeSessionIdPlaceholder,
        gift_card_id: giftCardId,
        gift_card_centavos: giftCardCentavos || null,
        gift_card_code: cupomCode,
        coupon_id: couponId,
        coupon_code: couponId ? cupomCode : null,
        coupon_discount_centavos: couponId ? couponDiscountCents : null,
        slot_id: slotId,
        quantidade: guardQty,
        fornecedor_nome: fornecedorNome,
        fornecedor_id: fornecedorId,
        valor_cheio_centavos: valorCheioFinal,
        valor_repasse_centavos: valorRepasseCentavos,
        valor_comissao_centavos: valorComissaoCentavos,
        repasses: repassesArray.length ? repassesArray : null,
        status_fornecedor: "repasse_pendente",
        acompanhantes: acompanhantes,
        metadata: { ...bookingMetadata, participantes },
      });
      if (retryErr) {
        console.error("[Elarah Payment/MP] retry insert falhou", retryErr);
        await rollback();
        return jsonResponse({ error: "booking_failed" }, 500);
      }
    } else {
      console.error("[Elarah Payment/MP] booking insert error", insertErr);
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }
  }

  console.info(
    "[Elarah Payment/MP] booking pending + QR code gerado",
    "booking=" + bookingId,
    "mp_payment=" + payment.id,
    "amount_cents=" + amountToChargeCents,
  );

  return jsonResponse({
    booking_id: bookingId,
    payment_id: String(payment.id),
    qr_code: qrCode,
    qr_code_base64: qrCodeBase64,
    ticket_url: ticketUrl,
    expires_at: payment.date_of_expiration,
    amount_total_centavos: amountToChargeCents,
  });
}

// =============================================================
// ENTRY
// =============================================================
serve(async (req) => {
  console.info(
    "[Elarah Payment/MP] create-mp-pix-payment BOOT",
    "version=" + PIX_FN_VERSION,
    "method=" + req.method,
  );

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }
  if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error(
      "[Elarah Payment/MP] env ausente",
      "MP_TOKEN=" + (MP_ACCESS_TOKEN ? "ok" : "MISSING"),
      "SUPABASE_URL=" + (SUPABASE_URL ? "ok" : "MISSING"),
      "SERVICE_ROLE=" + (SERVICE_ROLE ? "ok" : "MISSING"),
    );
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const mode = String(payload.mode ?? "experience");

  // Defesa final: se QUALQUER coisa lançar exceção dentro do handler
  // (RPC indisponível, schema desatualizado, MP fora do ar, etc.), a
  // gente captura aqui e devolve um erro NOMEADO + mensagem em PT —
  // nunca stack trace cru, nunca código técnico vazado pro front.
  try {
    if (mode === "gift_card") {
      return await handleGiftCardPixRequest(payload);
    }
    return await handlePixRequest(payload);
  } catch (e) {
    console.error(
      "[Elarah Payment/MP] EXCEPTION inesperada — checkout PIX abortado",
      "version=" + PIX_FN_VERSION,
      "mode=" + mode,
      "error=" + (e instanceof Error ? e.message : String(e)),
      "stack=" + (e instanceof Error ? e.stack : "(no stack)"),
    );
    return jsonResponse(
      {
        error: "checkout_unexpected_error",
        message:
          "Erro inesperado ao gerar o PIX. Tente novamente em instantes ou " +
          "pague no cartão.",
      },
      500,
    );
  }
});
