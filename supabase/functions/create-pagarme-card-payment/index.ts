// =============================================================
// ELARAH — create-pagarme-card-payment Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-pagarme-card-payment
//
// Cria um pagamento no CARTÃO (à vista ou parcelado) via Pagar.me,
// Checkout Transparente: o cliente digita o cartão DENTRO do site, o
// front tokeniza no Pagar.me (POST /tokens?appId=pk_...) e manda só o
// `card_token` (uso único). NENHUM dado sensível do cartão passa pelo
// nosso servidor — conformidade PCI garantida pela tokenização client-side.
//
// Envia TODOS os sinais de aprovação/antifraude desde o começo:
//   customer completo (nome, CPF, telefone, endereço) + itens +
//   device/fingerprint (metadata.session_id) + statement_descriptor +
//   idempotência por booking. (Ver _shared/pagarme.ts.)
//
// A confirmação final vem pelo pagarme-webhook (reconcilia por order.code
// == booking.id), igual ao PIX. Mesmo aprovado na hora, gravamos 'pending'
// e deixamos o webhook marcar 'pago' + disparar e-mails (idempotência única).
//
// Respostas:
//   200 { booking_id, order_id, charge_id, status, status_detail,
//         amount_total_centavos, three_ds?: {url} }
//   200 { direct: true, booking_id }          (cupom cobre 100%)
//   200 { rejected: true, status, status_detail, message }
//   4xx { error, message }
//   502 { error: "pagarme_create_failed", detail }
//
// Env: PAGARME_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      PUBLIC_SITE_URL, CARD_FEE_PERCENT, CARD_FEE_FIXED_CENTS
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { pagarmeFromEnv } from "../_shared/pagarme.ts";
import {
  assertExpectedTotal,
  computeChargeAmount,
  reserveExperienceSlot,
} from "../_shared/booking_guard.ts";
import {
  computeFinancialBreakdown,
  type SupplierRow,
} from "../_shared/financial.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAGARME_SECRET_KEY = Deno.env.get("PAGARME_SECRET_KEY") ?? "";
const IS_TEST_KEY = PAGARME_SECRET_KEY.startsWith("sk_test_");

const CARD_FN_VERSION = "v1-pagarme-card-2026-07-26";

// ===== Taxa do cartão (repasse pro cliente) — MESMAS envs do MP/Stripe =====
function parseFeeEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (raw == null || raw === "") return fallback;
  const n = Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0) {
    console.warn(
      "[Elarah Payment/Pagarme card] " + name + " inválido ('" + raw +
        "') — usando fallback " + fallback,
    );
    return fallback;
  }
  return n;
}
const CARD_FEE_PERCENT = parseFeeEnv("CARD_FEE_PERCENT", 0);
const CARD_FEE_FIXED_CENTS = parseFeeEnv("CARD_FEE_FIXED_CENTS", 0);

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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const pagarme = pagarmeFromEnv();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Cliente", last: "Elarah" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function splitPhone(
  digitsRaw: string | null,
): { areaCode: string; number: string } | undefined {
  const d = String(digitsRaw || "").replace(/\D+/g, "");
  if (d.length < 10) return undefined;
  return { areaCode: d.slice(0, 2), number: d.slice(2) };
}

async function handleCardRequest(
  payload: Record<string, unknown>,
): Promise<Response> {
  const cardToken = payload.token ? String(payload.token).trim() : "";
  if (!cardToken) {
    return jsonResponse({
      error: "card_token_required",
      message: "Dados do cartão incompletos. Recarregue e tente novamente.",
    }, 400);
  }

  const experienciaId = String(payload.experiencia_id ?? "").trim();
  const horario = payload.horario ? String(payload.horario).trim() : null;
  const dataFromPayload = payload.data ? String(payload.data).trim() : null;
  const slotIdFromPayload = payload.slot_id
    ? String(payload.slot_id).trim()
    : null;
  const email = payload.email ? String(payload.email).trim() : null;
  const nomeFromPayload = payload.nome ? String(payload.nome).trim() : null;
  const cupomCode = payload.cupom ? String(payload.cupom).trim() : null;
  const cpfRaw = String(payload.cpf ?? "").replace(/\D+/g, "");
  const quantidade = Math.max(1, Math.floor(Number(payload.quantidade) || 1));
  const participantes = Array.isArray(payload.participantes)
    ? payload.participantes
    : [];
  const variantLabel = payload.variant_label
    ? String(payload.variant_label).trim()
    : null;
  const variantSelected = payload.variant_selected
    ? String(payload.variant_selected).trim()
    : null;
  const variantExpectedCents = (function () {
    const n = Number(payload.variant_price_expected_centavos);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  })();

  const installments = Math.max(1, Math.floor(Number(payload.installments) || 1));
  const deviceId = payload.device_id ? String(payload.device_id).trim() : "";

  const telefoneHuman = payload.telefone
    ? String(payload.telefone).trim()
    : null;
  const telefoneDigits = payload.telefone_digits
    ? String(payload.telefone_digits).replace(/\D+/g, "")
    : (telefoneHuman ? telefoneHuman.replace(/\D+/g, "") : null);
  const telefoneValid = telefoneDigits && telefoneDigits.length >= 10 &&
    telefoneDigits.length <= 13;
  const telefoneToSave = telefoneValid
    ? (telefoneHuman || telefoneDigits)
    : (telefoneHuman || null);

  if (!experienciaId) {
    return jsonResponse({ error: "experiencia_id_required" }, 400);
  }
  if (!email || !/.+@.+\..+/.test(email)) {
    return jsonResponse(
      { error: "email_required", message: "E-mail é obrigatório." },
      400,
    );
  }
  if (!deviceId) {
    // Não bloqueia (a Pagar.me aceita sem), mas registra — é sinal de
    // aprovação/antifraude. O front DEVE mandar.
    console.warn(
      "[Elarah Payment/Pagarme card] device_id ausente — aprovação pode cair",
    );
  }

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
      "[Elarah Payment/Pagarme card] guard rejeitou",
      "code=" + guard.errorCode,
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

  const valorCheioFinal = valorCheioCentavos
    ? valorCheioCentavos * guardQty
    : null;

  let suppliers: SupplierRow[] = [];
  try {
    const { data: supRows, error: supErr } = await supabase
      .from("experience_suppliers")
      .select("fornecedor_nome, share_type, share_value, ordem, notas")
      .eq("experience_id", exp.id)
      .order("ordem", { ascending: true });
    if (!supErr && Array.isArray(supRows)) suppliers = supRows as SupplierRow[];
  } catch (e) {
    console.warn("[Elarah Payment/Pagarme card] suppliers exception", e);
  }

  const breakdownFin = valorCheioFinal != null
    ? computeFinancialBreakdown(
      valorCheioFinal,
      suppliers,
      {
        type: (exp as { comissao_type?: string | null }).comissao_type ?? null,
        value: (exp as { comissao_value?: number | null }).comissao_value ??
          null,
      },
      {
        fornecedorNome,
        percentualRepasse,
        valorRepasseFixoCentavos: valorRepasseFixoCentavos != null
          ? Number(valorRepasseFixoCentavos) * guardQty
          : null,
      },
    )
    : null;

  const valorRepasseCentavos = breakdownFin
    ? breakdownFin.totalRepasseCentavos
    : null;
  const valorComissaoCentavos = breakdownFin
    ? breakdownFin.comissaoCentavos
    : null;
  const repassesArray = breakdownFin ? breakdownFin.repasses : [];

  // ===== Cupom cobre 100% — pula o gateway =====
  if (amountToChargeCents === 0) {
    const directBookingId = crypto.randomUUID();
    const { error: directErr } = await supabase.from("bookings").insert({
      id: directBookingId,
      user_id: userId,
      email,
      nome: resolvedNome,
      telefone: telefoneToSave,
      experiencia_id: exp.id,
      experiencia_nome: exp.nome,
      data: slotData ?? dataFromPayload ?? exp.data ?? null,
      horario,
      preco_label: exp.preco,
      amount_total: 0,
      currency: "brl",
      status: "pago",
      stripe_session_id: "PME-GIFT-" + directBookingId.slice(0, 12),
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
      payment_provider: "pagarme",
      metadata: {
        bairro: exp.bairro ?? null,
        endereco: exp.endereco ?? null,
        paid_with_gift_card_only: true,
        participantes,
        telefone_digits: telefoneDigits || null,
        payment_method: "card",
        cpf: cpfRaw || null,
      },
    });
    if (directErr) {
      console.error(
        "[Elarah Payment/Pagarme card] direct booking insert falhou",
        directErr,
      );
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }
    return jsonResponse({
      direct: true,
      booking_id: directBookingId,
      paid_with_gift_card: true,
      gift_card_centavos: giftCardCentavos,
    });
  }

  // ===== Cobra no cartão =====
  const bookingId = crypto.randomUUID();
  const { first, last } = splitName(resolvedNome || "Cliente Elarah");

  const breakdown = computeChargeAmount(baseCents, guardQty, giftCardCentavos);
  try {
    assertExpectedTotal(breakdown, amountToChargeCents, "pagarme card payment");
  } catch (e) {
    console.error("[Elarah Payment/Pagarme card] assertExpectedTotal falhou", e);
    await rollback();
    return jsonResponse({
      error: "amount_mismatch",
      message: "Erro interno no cálculo do total. Recarregue e tente novamente.",
    }, 500);
  }

  const feeInfo = applyCardFee(amountToChargeCents);
  const finalChargeCents = feeInfo.finalCents;
  console.info(
    "[Elarah Payment/Pagarme card] taxa do cartão",
    "base=" + amountToChargeCents,
    "fee_total=" + feeInfo.feeTotalCents,
    "final=" + finalChargeCents,
    "installments=" + installments,
  );

  const itemTitle =
    [exp.nome, exp.data, horario].filter(Boolean).join(" · ") || exp.nome;
  const itemDescription =
    [exp.nome, exp.bairro, exp.data, horario].filter(Boolean).join(" · ") ||
    exp.nome;

  const result = await pagarme.createCardPayment({
    amountCents: finalChargeCents,
    description: itemTitle.slice(0, 250),
    externalReference: bookingId,
    cardToken,
    installments,
    customer: {
      email,
      firstName: first,
      lastName: last,
      cpf: cpfRaw,
      phone: splitPhone(telefoneDigits),
    },
    items: [{
      id: bookingId,
      title: String(exp.nome).slice(0, 250),
      description: String(itemDescription).slice(0, 250),
      categoryId: "entertainment",
      quantity: 1,
      unitPriceCents: finalChargeCents,
    }],
    statementDescriptor: "ELARAH",
    idempotencyKey: bookingId,
    deviceId: deviceId || undefined,
  });

  if (!result.ok || !result.data) {
    console.error(
      "[Elarah Payment/Pagarme card] /orders falhou, rollback",
      "status=" + result.errorStatus,
      "body=" + JSON.stringify(result.errorBody),
    );
    await rollback();
    return jsonResponse({
      error: "pagarme_create_failed",
      message: "Não foi possível processar o cartão. Confira os dados ou pague no PIX.",
      detail: result.errorBody,
    }, 502);
  }

  const payment = result.data;
  const status = payment.status;
  const statusDetail = payment.statusDetail ?? "";

  console.info(
    "[Elarah Payment/Pagarme card] resultado",
    "booking=" + bookingId,
    "order=" + payment.id,
    "charge=" + (payment.chargeId ?? "?"),
    "status=" + status,
    "status_detail=" + statusDetail,
    "installments=" + installments,
  );

  // ----- Recusado / cancelado: libera estoque e devolve o motivo -----
  if (status === "rejected" || status === "cancelled") {
    await rollback();
    return jsonResponse({
      rejected: true,
      order_id: payment.id,
      status,
      status_detail: statusDetail,
      message: "Pagamento recusado pelo emissor. Tente outro cartão ou pague no PIX.",
    });
  }

  // ----- Aprovado / em processamento / 3DS: grava booking pending -----
  const bookingMetadata: Record<string, unknown> = {
    bairro: exp.bairro ?? null,
    endereco: exp.endereco ?? null,
    telefone_digits: telefoneDigits || null,
    unit_price_centavos: breakdown.unitCents,
    subtotal_centavos: breakdown.subtotalCents,
    discount_centavos: breakdown.discountCents,
    total_after_discount_centavos: breakdown.totalCents,
    preco_total_centavos: breakdown.subtotalCents,
    card_fee_percent_centavos: feeInfo.feePercentCents,
    card_fee_fixed_centavos: feeInfo.feeFixedCents,
    card_fee_total_centavos: feeInfo.feeTotalCents,
    amount_before_fee_centavos: amountToChargeCents,
    payment_method: "card",
    payment_provider: "pagarme",
    cpf: cpfRaw || null,
    pagarme_order_id: payment.id,
    pagarme_charge_id: payment.chargeId,
    pagarme_status_inicial: status,
    pagarme_status_detail_inicial: statusDetail,
    pagarme_installments: installments,
    pagarme_device_id_sent: deviceId ? true : false,
    inventory_skipped: inventorySkipped || undefined,
    variant_label: variantLabel || undefined,
    variant_selected: variantSelected || undefined,
  };

  const baseRow: Record<string, unknown> = {
    id: bookingId,
    user_id: userId,
    email,
    nome: resolvedNome,
    telefone: telefoneToSave,
    experiencia_id: exp.id,
    experiencia_nome: exp.nome,
    data: slotData ?? dataFromPayload ?? exp.data ?? null,
    horario,
    preco_label: exp.preco,
    amount_total: finalChargeCents,
    currency: "brl",
    status: "pending",
    stripe_session_id: "PME-" + payment.id,
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
    payment_provider: "pagarme",
    pagarme_order_id: payment.id,
    pagarme_charge_id: payment.chargeId,
    metadata: { ...bookingMetadata, participantes },
  };

  let insertOk = false;
  const { error: insertErr } = await supabase.from("bookings").insert(baseRow);
  if (!insertErr) {
    insertOk = true;
  } else {
    const msg = String(insertErr.message || "").toLowerCase();
    const looksLikeNewColumnsMissing =
      (msg.includes("pagarme_order_id") || msg.includes("pagarme_charge_id") ||
        msg.includes("payment_provider")) &&
      (msg.includes("column") || msg.includes("schema cache"));
    if (looksLikeNewColumnsMissing) {
      console.warn(
        "[Elarah Payment/Pagarme card] colunas pagarme_* ausentes — retry sem elas",
      );
      const retryRow = { ...baseRow };
      delete retryRow.pagarme_order_id;
      delete retryRow.pagarme_charge_id;
      delete retryRow.payment_provider;
      const { error: retryErr } = await supabase.from("bookings").insert(
        retryRow,
      );
      insertOk = !retryErr;
      if (retryErr) {
        console.error(
          "[Elarah Payment/Pagarme card] retry insert falhou",
          retryErr,
        );
      }
    } else {
      console.error(
        "[Elarah Payment/Pagarme card] booking insert error",
        insertErr,
      );
    }
  }

  if (!insertOk) {
    // A cobrança JÁ foi feita — não dá pra rollback sem deixar pagamento
    // órfão. Registra em alto volume pro admin (mesmo tratamento do MP).
    console.error(
      "[Elarah Payment/Pagarme card] PAGAMENTO FEITO MAS BOOKING NÃO GRAVOU",
      "order=" + payment.id,
      "booking=" + bookingId,
      "amount=" + finalChargeCents,
    );
    return jsonResponse({
      error: "booking_failed_after_charge",
      order_id: payment.id,
      message: "O pagamento foi processado, mas houve um erro ao registrar a reserva. " +
        "Guarde este código e nos chame no WhatsApp: " + bookingId,
    }, 500);
  }

  const threeDs = payment.threeDs?.url ? { url: payment.threeDs.url } : null;

  return jsonResponse({
    booking_id: bookingId,
    order_id: payment.id,
    charge_id: payment.chargeId,
    status,
    status_detail: statusDetail,
    amount_total_centavos: finalChargeCents,
    card_fee_total_centavos: feeInfo.feeTotalCents,
    three_ds: threeDs,
    is_test: IS_TEST_KEY,
  });
}

serve(async (req) => {
  console.info(
    "[Elarah Payment/Pagarme card] create-pagarme-card-payment BOOT",
    "version=" + CARD_FN_VERSION,
    "method=" + req.method,
  );

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }
  if (!PAGARME_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error(
      "[Elarah Payment/Pagarme card] env ausente",
      "SECRET_KEY=" + (PAGARME_SECRET_KEY ? "ok" : "MISSING"),
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

  try {
    return await handleCardRequest(payload);
  } catch (e) {
    console.error(
      "[Elarah Payment/Pagarme card] EXCEPTION inesperada — checkout cartão abortado",
      "version=" + CARD_FN_VERSION,
      "error=" + (e instanceof Error ? e.message : String(e)),
      "stack=" + (e instanceof Error ? e.stack : "(no stack)"),
    );
    return jsonResponse({
      error: "checkout_unexpected_error",
      message: "Erro inesperado ao iniciar o pagamento. Tente novamente ou pague no PIX.",
    }, 500);
  }
});
