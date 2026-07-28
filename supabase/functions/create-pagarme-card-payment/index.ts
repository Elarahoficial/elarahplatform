// =============================================================
// ELARAH — create-pagarme-card-payment Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-pagarme-card-payment
//
// CARTÃO TRANSPARENTE via Pagar.me (Orders API). O cliente digita o
// cartão no site; o front tokeniza DIRETO no Pagar.me (o cartão nunca
// passa por aqui — só o `card_token`) e manda o token + a PARCELA
// escolhida. A gente:
//   - recomputa o total grossed-up da parcela (buildInstallmentOptions,
//     autoritativo no servidor — o front nunca dita o valor);
//   - cria a Order com amount = esse total (o acréscimo já está embutido;
//     `installments` só DIVIDE, sem juros extra) e captura na hora;
//   - grava a booking pending com amount_total = total cobrado, mas o
//     SPLIT FINANCEIRO (valor_cheio/repasse/comissão) fica no VALOR-BASE.
//
// A confirmação vem pelo MESMO pagarme-webhook (order.code == booking.id),
// que já lê installments do charge. Espelha create-mp-card-payment.
//
// Respostas:
//   200 { booking_id, order_id, status, amount_total_centavos, installments }
//   200 { direct: true, booking_id }        (cupom cobre 100%)
//   200 { rejected: true, status, message } (cartão recusado)
//   4xx { error, message }
//   502 { error: "pagarme_create_failed", detail }
//
// Env: PAGARME_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { buildInstallmentOptions, createCardOrder } from "../_shared/pagarme.ts";
import { isValidCpf } from "../_shared/mercadopago.ts";
import {
  assertExpectedTotal,
  computeChargeAmount,
  reserveExperienceSlot,
} from "../_shared/booking_guard.ts";
import {
  computeFinancialBreakdown,
  type SupplierRow,
} from "../_shared/financial.ts";

const PAGARME_SECRET_KEY = Deno.env.get("PAGARME_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MAX_INSTALLMENTS = Math.max(
  1,
  Math.min(12, Math.floor(Number(Deno.env.get("PAGARME_MAX_INSTALLMENTS")) || 12)),
);

const CARD_FN_VERSION = "v1-pagarme-card-transparente-2026-07-28";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleRequest(payload: Record<string, unknown>): Promise<Response> {
  if (!PAGARME_SECRET_KEY) {
    return jsonResponse(
      { error: "pagarme_not_configured", message: "Pagar.me não configurado." },
      500,
    );
  }

  // ===== Parse =====
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
  const variantLabel = payload.variant_label ? String(payload.variant_label).trim() : null;
  const variantSelected = payload.variant_selected ? String(payload.variant_selected).trim() : null;
  const variantExpectedCents = (function () {
    const n = Number(payload.variant_price_expected_centavos);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  })();

  // ===== Dados do cartão (tokenizado no front) =====
  const cardToken = payload.card_token ? String(payload.card_token).trim() : "";
  const installments = Math.max(1, Math.min(12, Math.floor(Number(payload.installments) || 1)));

  const telefoneHuman = payload.telefone ? String(payload.telefone).trim() : null;
  const telefoneDigits = payload.telefone_digits
    ? String(payload.telefone_digits).replace(/\D+/g, "")
    : (telefoneHuman ? telefoneHuman.replace(/\D+/g, "") : null);
  const telefoneValid =
    telefoneDigits && telefoneDigits.length >= 10 && telefoneDigits.length <= 13;
  const telefoneToSave = telefoneValid ? (telefoneHuman || telefoneDigits) : (telefoneHuman || null);

  // ===== Validações =====
  if (!experienciaId) return jsonResponse({ error: "experiencia_id_required" }, 400);
  if (!email || !/.+@.+\..+/.test(email)) {
    return jsonResponse({ error: "email_required", message: "E-mail é obrigatório." }, 400);
  }
  if (!isValidCpf(cpfRaw)) {
    return jsonResponse({ error: "cpf_required", message: "CPF inválido. Use 11 dígitos." }, 400);
  }
  if (!cardToken) {
    return jsonResponse(
      { error: "card_token_required", message: "Dados do cartão incompletos. Recarregue e tente novamente." },
      400,
    );
  }

  // ===== Reserva slot =====
  const guard = await reserveExperienceSlot(supabase, {
    experienciaId, horario, data: dataFromPayload, slotId: slotIdFromPayload,
    email, nome: nomeFromPayload, cupomCode, quantidade,
    variantSelected, variantExpectedCents,
  });
  if (!guard.ok) {
    console.warn("[Elarah Payment/Pagarme card] guard rejeitou", "code=" + guard.errorCode);
    return jsonResponse({ error: guard.errorCode, message: guard.errorMessage }, guard.errorStatus);
  }

  const {
    exp, userId, resolvedNome, baseCents, giftCardId, giftCardCentavos,
    couponId, couponDiscountCents, amountToChargeCents, slotId, slotData,
    quantidade: guardQty, fornecedorId, fornecedorNome, valorCheioCentavos,
    percentualRepasse, valorRepasseFixoCentavos, inventorySkipped, rollback,
  } = guard;

  // ===== Mapa financeiro (split SEMPRE no valor-base) =====
  const valorCheioFinal = valorCheioCentavos ? valorCheioCentavos * guardQty : null;
  let suppliers: SupplierRow[] = [];
  try {
    const { data: supRows } = await supabase
      .from("experience_suppliers")
      .select("fornecedor_nome, share_type, share_value, ordem, notas")
      .eq("experience_id", exp.id)
      .order("ordem", { ascending: true });
    if (Array.isArray(supRows)) suppliers = supRows as SupplierRow[];
  } catch (e) {
    console.warn("[Elarah Payment/Pagarme card] experience_suppliers exception", e);
  }
  const breakdownFin = valorCheioFinal != null
    ? computeFinancialBreakdown(
      valorCheioFinal, suppliers,
      {
        type: (exp as { comissao_type?: string | null }).comissao_type ?? null,
        value: (exp as { comissao_value?: number | null }).comissao_value ?? null,
      },
      {
        fornecedorNome, percentualRepasse,
        valorRepasseFixoCentavos: valorRepasseFixoCentavos != null
          ? Number(valorRepasseFixoCentavos) * guardQty : null,
      },
    )
    : null;
  const valorRepasseCentavos = breakdownFin ? breakdownFin.totalRepasseCentavos : null;
  const valorComissaoCentavos = breakdownFin ? breakdownFin.comissaoCentavos : null;
  const repassesArray = breakdownFin ? breakdownFin.repasses : [];

  // ===== Cupom cobre 100% — grava direto pago (sem cartão) =====
  if (amountToChargeCents === 0) {
    const directBookingId = crypto.randomUUID();
    const { error: directErr } = await supabase.from("bookings").insert({
      id: directBookingId, user_id: userId, email, nome: resolvedNome,
      telefone: telefoneToSave, experiencia_id: exp.id, experiencia_nome: exp.nome,
      data: slotData ?? dataFromPayload ?? exp.data ?? null, horario,
      preco_label: exp.preco, amount_total: 0, currency: "brl", status: "pago",
      stripe_session_id: "PAGARME-GIFT-" + directBookingId.slice(0, 12),
      gift_card_id: giftCardId, gift_card_centavos: giftCardCentavos,
      gift_card_code: cupomCode, coupon_id: couponId,
      coupon_code: couponId ? cupomCode : null,
      coupon_discount_centavos: couponId ? couponDiscountCents : null,
      slot_id: slotId, quantidade: guardQty, fornecedor_nome: fornecedorNome,
      fornecedor_id: fornecedorId, valor_cheio_centavos: valorCheioFinal,
      valor_repasse_centavos: valorRepasseCentavos, valor_comissao_centavos: valorComissaoCentavos,
      repasses: repassesArray.length ? repassesArray : null,
      status_fornecedor: "repasse_pendente", payment_provider: "pagarme",
      metadata: {
        bairro: exp.bairro ?? null, endereco: exp.endereco ?? null,
        paid_with_gift_card_only: true, participantes,
        telefone_digits: telefoneDigits || null, payment_method: "card",
        cpf: cpfRaw, variant_label: variantLabel, variant_selected: variantSelected,
      },
    });
    if (directErr) {
      console.error("[Elarah Payment/Pagarme card] direct booking insert falhou", directErr);
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }
    return jsonResponse({
      direct: true, booking_id: directBookingId, paid_with_gift_card: true,
      gift_card_centavos: giftCardCentavos,
    });
  }

  // ===== Sanity check + total grossed-up da parcela (autoritativo) =====
  const breakdown = computeChargeAmount(baseCents, guardQty, giftCardCentavos);
  try {
    assertExpectedTotal(breakdown, amountToChargeCents, "pagarme card");
  } catch (e) {
    console.error("[Elarah Payment/Pagarme card] assertExpectedTotal falhou", e);
    await rollback();
    return jsonResponse({ error: "amount_mismatch" }, 500);
  }

  // O SERVIDOR recomputa o total da parcela — o front nunca dita o valor.
  const options = buildInstallmentOptions(amountToChargeCents, MAX_INSTALLMENTS);
  const selected = options.find((o) => o.number === installments);
  if (!selected) {
    console.error(
      "[Elarah Payment/Pagarme card] parcela inválida",
      "installments=" + installments, "disponíveis=" + options.map((o) => o.number).join(","),
    );
    await rollback();
    return jsonResponse(
      { error: "invalid_installments", message: "Opção de parcelamento inválida. Recarregue e tente novamente." },
      400,
    );
  }
  const chargeCents = selected.total; // total grossed-up cobrado no cartão

  const bookingId = crypto.randomUUID();
  const itemTitle = (exp.nome || "Experiência Elarah") + (horario ? " · " + horario : "");
  const phoneAreaCode = telefoneDigits ? telefoneDigits.slice(0, 2) : undefined;
  const phoneNumber = telefoneDigits ? telefoneDigits.slice(2) : undefined;

  console.info(
    "[Elarah Payment/Pagarme card] cobrando",
    "booking=" + bookingId, "base=" + amountToChargeCents,
    "installments=" + installments, "charge=" + chargeCents,
  );

  const cardResult = await createCardOrder(PAGARME_SECRET_KEY, {
    amountCents: chargeCents, // total grossed-up da parcela escolhida
    installments,
    cardToken,
    bookingId,
    description: itemTitle.slice(0, 64),
    customer: {
      name: resolvedNome || "Cliente Elarah",
      email: email!,
      cpf: cpfRaw,
      phone: { areaCode: phoneAreaCode, number: phoneNumber },
    },
    statementDescriptor: "ELARAH",
    itemCode: exp.id,
  });

  // ----- Erro de comunicação/validação com o Pagar.me: rollback + 502 -----
  if (!cardResult.ok) {
    console.error(
      "[Elarah Payment/Pagarme card] order card falhou",
      "status=" + cardResult.errorStatus,
      "body=" + JSON.stringify(cardResult.errorBody),
    );
    await rollback();
    return jsonResponse(
      {
        error: "pagarme_create_failed",
        message: "Não foi possível processar o cartão. Confira os dados ou pague no PIX.",
        detail: cardResult.errorBody,
      },
      502,
    );
  }

  // ----- Cartão recusado (order/charge failed): libera e devolve motivo -----
  const orderStatus = String(cardResult.orderStatus || "");
  const txStatus = String(cardResult.transactionStatus || "");
  const refused = orderStatus === "failed" || orderStatus === "canceled" ||
    txStatus === "not_authorized" || txStatus === "refused" || txStatus === "with_error";
  if (refused) {
    console.info(
      "[Elarah Payment/Pagarme card] recusado",
      "order_status=" + orderStatus, "tx_status=" + txStatus,
      "acq=" + (cardResult.acquirerMessage || "?"),
    );
    await rollback();
    return jsonResponse({
      rejected: true,
      order_id: cardResult.orderId,
      status: orderStatus || txStatus,
      message: "Pagamento recusado pelo emissor. Tente outro cartão ou pague no PIX.",
    });
  }

  // ----- Aprovado / em captura: grava booking pending (webhook finaliza) -----
  // Igual ao MP card: mesmo aprovado, gravamos pending e deixamos o
  // pagarme-webhook marcar 'pago' + disparar e-mails (idempotência).
  const { error: insertErr } = await supabase.from("bookings").insert({
    id: bookingId, user_id: userId, email, nome: resolvedNome,
    telefone: telefoneToSave, experiencia_id: exp.id, experiencia_nome: exp.nome,
    data: slotData ?? dataFromPayload ?? exp.data ?? null, horario,
    preco_label: exp.preco, amount_total: chargeCents, currency: "brl",
    status: "pending", stripe_session_id: "PAGARME-CARD-" + bookingId.slice(0, 12),
    gift_card_id: giftCardId, gift_card_centavos: giftCardCentavos || null,
    gift_card_code: cupomCode, coupon_id: couponId,
    coupon_code: couponId ? cupomCode : null,
    coupon_discount_centavos: couponId ? couponDiscountCents : null,
    slot_id: slotId, quantidade: guardQty, fornecedor_nome: fornecedorNome,
    fornecedor_id: fornecedorId, valor_cheio_centavos: valorCheioFinal,
    valor_repasse_centavos: valorRepasseCentavos, valor_comissao_centavos: valorComissaoCentavos,
    repasses: repassesArray.length ? repassesArray : null,
    status_fornecedor: "repasse_pendente", mp_payment_id: cardResult.orderId ?? null,
    payment_provider: "pagarme",
    metadata: {
      bairro: exp.bairro ?? null, endereco: exp.endereco ?? null,
      participantes, telefone_digits: telefoneDigits || null,
      payment_method: "card", cpf: cpfRaw,
      variant_label: variantLabel, variant_selected: variantSelected,
      pagarme_order_id: cardResult.orderId ?? null,
      // Auditoria do gross-up: base × total cobrado × parcela.
      amount_before_grossup_centavos: amountToChargeCents,
      grossup_centavos: chargeCents - amountToChargeCents,
      installments: installments,
      inventory_skipped: inventorySkipped || undefined,
    },
  });

  if (insertErr) {
    // A cobrança JÁ foi feita — não dá rollback sem deixar pagamento órfão.
    console.error(
      "[Elarah Payment/Pagarme card] PAGAMENTO FEITO MAS BOOKING NÃO GRAVOU",
      "order=" + cardResult.orderId, "booking=" + bookingId, "amount=" + chargeCents,
      "err=" + insertErr.message,
    );
    return jsonResponse(
      {
        error: "booking_failed_after_charge",
        order_id: cardResult.orderId,
        message: "O pagamento foi processado, mas houve um erro ao registrar a reserva. " +
          "Guarde este código e nos chame no WhatsApp: " + bookingId,
      },
      500,
    );
  }

  console.info(
    "[Elarah Payment/Pagarme card] booking pending",
    "booking=" + bookingId, "order=" + cardResult.orderId,
    "order_status=" + orderStatus, "amount=" + chargeCents, "installments=" + installments,
  );

  return jsonResponse({
    booking_id: bookingId,
    order_id: cardResult.orderId,
    status: orderStatus || "processing",
    amount_total_centavos: chargeCents,
    installments,
  });
}

serve(async (req) => {
  console.info("[Elarah Payment/Pagarme card] BOOT", "version=" + CARD_FN_VERSION, "method=" + req.method);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
  if (!PAGARME_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[Elarah Payment/Pagarme card] env ausente");
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  try {
    return await handleRequest(payload);
  } catch (e) {
    console.error("[Elarah Payment/Pagarme card] EXCEPTION", e);
    return jsonResponse(
      { error: "checkout_unexpected_error", message: "Erro inesperado ao processar o cartão. Tente novamente ou pague no PIX." },
      500,
    );
  }
});
