// =============================================================
// ELARAH — create-pagarme-pix-payment Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-pagarme-pix-payment
//
// Cria um pagamento PIX via Pagar.me e pré-grava a booking em
// status='pending'. Devolve pro frontend o QR (copia-e-cola + URL da
// imagem) pra exibir inline no modal. O cliente nunca sai do site.
// O polling do front + o pagarme-webhook cuidam da confirmação.
//
// Reaproveita EXATAMENTE a mesma lógica de negócio do fluxo do MP:
//   _shared/booking_guard.ts  — reserva/estoque/cupom/rollback
//   _shared/financial.ts      — mapa de repasse/comissão
// A ÚNICA diferença é o provider (Pagar.me via _shared/pagarme.ts,
// implementando a interface PaymentProvider).
//
// Payload (mode "experience"):
//   { experiencia_id, horario, data?, slot_id?, email, nome, cpf,
//     telefone?, telefone_digits?, cupom?, quantidade?, device_id?,
//     participantes?, variant_* }
// Payload (mode "gift_card"): igual ao create-mp-pix-payment.
//
// Respostas:
//   200 { booking_id, order_id, charge_id, qr_code, qr_code_url,
//         expires_at, amount_total_centavos, direct?: true }
//   4xx { error, message }
//   502 { error: "pagarme_create_failed", detail }
//
// Env: PAGARME_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      PUBLIC_SITE_URL
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { isValidCpf, pagarmeFromEnv } from "../_shared/pagarme.ts";
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

const PIX_FN_VERSION = "v1-pagarme-pix-2026-07-26";

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

// =============================================================
// MODO B — gift card via PIX (Pagar.me)
// -------------------------------------------------------------
// Espelha o handleGiftCardPixRequest do MP: gera PIX, pré-grava o
// gift_card 'pending' com external_reference "GIFT-<uuid>". O
// pagarme-webhook detecta o prefixo "GIFT-" no order.code e ativa o
// gift card (gera código, envia e-mails).
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
  if (!buyerEmail || !/.+@.+\..+/.test(buyerEmail)) {
    return jsonResponse({
      error: "buyer_email_required",
      message: "Informe seu e-mail — exigido pra gerar o PIX.",
    }, 400);
  }
  if (!isValidCpf(cpfRaw)) {
    return jsonResponse({
      error: "cpf_required",
      message: "CPF inválido. O PIX exige CPF válido do pagador.",
    }, 400);
  }

  let buyerUserId: string | null = null;
  if (buyerEmail) {
    const { data: prof } = await supabase
      .from("profiles").select("id").eq("email", buyerEmail).maybeSingle();
    if (prof) buyerUserId = (prof as { id?: string }).id ?? null;
  }

  const giftCardId = crypto.randomUUID();
  const externalReference = "GIFT-" + giftCardId;
  const sessionPlaceholder = "PME-GIFT-" + giftCardId;

  const giftCardRow = {
    id: giftCardId,
    code: "PENDING-PME-" + giftCardId.slice(-12).toUpperCase(),
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
      payment_provider: "pagarme",
      cpf: cpfRaw,
    },
  };

  const { error: insertErr } = await supabase.from("gift_cards").insert(
    giftCardRow,
  );
  if (insertErr) {
    console.error(
      "[Elarah Payment/Pagarme gift] FALHA ao pré-gravar gift card",
      JSON.stringify(insertErr),
    );
    return jsonResponse({
      error: "gift_card_save_failed",
      message: "Não foi possível registrar o gift card antes do pagamento.",
      detail: insertErr,
    }, 500);
  }

  const { first, last } = splitName(buyerNome || "Cliente Elarah");
  const giftDescription =
    ("Gift Card Elarah para " + (recipientNome || recipientEmail)).slice(0, 250);

  const result = await pagarme.createPixPayment({
    amountCents: valor,
    description: giftDescription,
    externalReference,
    customer: {
      email: buyerEmail,
      firstName: first,
      lastName: last,
      cpf: cpfRaw,
    },
    items: [{
      id: giftCardId,
      title: "Gift Card Elarah",
      description: giftDescription,
      categoryId: "gift_cards",
      quantity: 1,
      unitPriceCents: valor,
    }],
    expiresInMinutes: 30,
    idempotencyKey: giftCardId,
    deviceId: payload.device_id ? String(payload.device_id).trim() : undefined,
  });

  if (!result.ok || !result.data) {
    console.error(
      "[Elarah Payment/Pagarme gift] erro ao criar PIX, cancelando pre-insert",
      "status=" + result.errorStatus,
      "body=" + JSON.stringify(result.errorBody),
    );
    await supabase.from("gift_cards").update({ status: "cancelled" }).eq(
      "id",
      giftCardId,
    );
    return jsonResponse({
      error: "pagarme_create_failed",
      message: "Não foi possível gerar o PIX. Tente novamente.",
      detail: result.errorBody,
    }, 502);
  }

  const payment = result.data;
  const qrCode = payment.pix?.qrCode ?? null;
  const qrCodeUrl = payment.pix?.qrCodeUrl ?? null;
  if (!qrCode && !qrCodeUrl) {
    await supabase.from("gift_cards").update({ status: "cancelled" }).eq(
      "id",
      giftCardId,
    );
    return jsonResponse(
      { error: "pagarme_qr_missing", message: "Pagar.me respondeu sem QR." },
      502,
    );
  }

  // Só metadata (não a coluna dedicada) — a reconciliação do gift card é
  // pelo order.code ("GIFT-<id>"), então isto nunca depende da migration
  // ter rodado. Mantém o id no metadata pra auditoria/estorno.
  await supabase.from("gift_cards").update({
    metadata: {
      payment_method: "pix",
      payment_provider: "pagarme",
      cpf: cpfRaw,
      pagarme_order_id: payment.id,
      pagarme_charge_id: payment.chargeId,
      pix_expires_at: payment.pix?.expiresAt,
    },
  }).eq("id", giftCardId);

  console.info(
    "[Elarah Payment/Pagarme gift] gift card pre-saved + QR gerado",
    "gift_card_id=" + giftCardId,
    "order=" + payment.id,
  );

  return jsonResponse({
    gift_card_id: giftCardId,
    order_id: payment.id,
    charge_id: payment.chargeId,
    qr_code: qrCode,
    qr_code_url: qrCodeUrl,
    expires_at: payment.pix?.expiresAt,
    amount_total_centavos: valor,
    is_test: IS_TEST_KEY,
  });
}

async function handlePixRequest(
  payload: Record<string, unknown>,
): Promise<Response> {
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
      { error: "email_required", message: "E-mail é obrigatório pra PIX." },
      400,
    );
  }
  if (!isValidCpf(cpfRaw)) {
    return jsonResponse({
      error: "cpf_required",
      message: "CPF inválido. Use 11 dígitos — o PIX exige CPF do pagador.",
    }, 400);
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
      "[Elarah Payment/Pagarme] guard rejeitou",
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

  // ===== Mapa financeiro (idêntico ao MP/Stripe) =====
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
    if (supErr) {
      console.warn(
        "[Elarah Payment/Pagarme] experience_suppliers lookup falhou — fallback legado",
        supErr.message,
      );
    } else if (Array.isArray(supRows)) {
      suppliers = supRows as SupplierRow[];
    }
  } catch (e) {
    console.warn("[Elarah Payment/Pagarme] experience_suppliers exception", e);
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
        payment_method: "pix",
        cpf: cpfRaw,
      },
    });
    if (directErr) {
      console.error(
        "[Elarah Payment/Pagarme] direct booking insert falhou",
        directErr,
      );
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }
    console.info(
      "[Elarah Payment/Pagarme] booking gratuita via cupom 100%",
      "booking=" + directBookingId,
    );
    return jsonResponse({
      direct: true,
      booking_id: directBookingId,
      paid_with_gift_card: true,
      gift_card_centavos: giftCardCentavos,
    });
  }

  // ===== Cria o PIX =====
  const bookingId = crypto.randomUUID();
  const { first, last } = splitName(resolvedNome || "Cliente Elarah");

  const breakdown = computeChargeAmount(baseCents, guardQty, giftCardCentavos);
  try {
    assertExpectedTotal(breakdown, amountToChargeCents, "pagarme pix payment");
  } catch (e) {
    console.error("[Elarah Payment/Pagarme] assertExpectedTotal falhou", e);
    await rollback();
    return jsonResponse({
      error: "amount_mismatch",
      message: "Erro interno no cálculo do total. Recarregue e tente novamente.",
    }, 500);
  }

  const pixDescription = [exp.nome, exp.data, horario].filter(Boolean).join(
    " · ",
  ).slice(0, 250);

  const result = await pagarme.createPixPayment({
    amountCents: amountToChargeCents,
    description: pixDescription,
    externalReference: bookingId,
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
      description: pixDescription,
      categoryId: "entertainment",
      quantity: 1,
      unitPriceCents: amountToChargeCents,
    }],
    expiresInMinutes: 30,
    idempotencyKey: bookingId,
    deviceId: payload.device_id ? String(payload.device_id).trim() : undefined,
  });

  if (!result.ok || !result.data) {
    console.error(
      "[Elarah Payment/Pagarme] erro ao criar PIX, rollback",
      "status=" + result.errorStatus,
      "body=" + JSON.stringify(result.errorBody),
    );
    await rollback();
    return jsonResponse({
      error: "pagarme_create_failed",
      message: "Não foi possível gerar o PIX. Tente novamente ou pague no cartão.",
      detail: result.errorBody,
    }, 502);
  }

  const payment = result.data;
  const qrCode = payment.pix?.qrCode ?? null;
  const qrCodeUrl = payment.pix?.qrCodeUrl ?? null;
  if (!qrCode && !qrCodeUrl) {
    console.error(
      "[Elarah Payment/Pagarme] resposta sem QR",
      JSON.stringify(payment),
    );
    await rollback();
    return jsonResponse(
      { error: "pagarme_qr_missing", message: "Pagar.me respondeu sem QR." },
      502,
    );
  }

  const bookingMetadata = {
    bairro: exp.bairro ?? null,
    endereco: exp.endereco ?? null,
    telefone_digits: telefoneDigits || null,
    unit_price_centavos: breakdown.unitCents,
    subtotal_centavos: breakdown.subtotalCents,
    discount_centavos: breakdown.discountCents,
    total_after_discount_centavos: breakdown.totalCents,
    preco_total_centavos: breakdown.subtotalCents,
    payment_method: "pix",
    payment_provider: "pagarme",
    cpf: cpfRaw,
    pagarme_order_id: payment.id,
    pagarme_charge_id: payment.chargeId,
    pix_expires_at: payment.pix?.expiresAt,
    inventory_skipped: inventorySkipped || undefined,
    variant_label: variantLabel || undefined,
    variant_selected: variantSelected || undefined,
  };

  // stripe_session_id é UNIQUE — usamos o placeholder "PME-<order_id>".
  const insertOk = await insertPendingBooking({
    bookingId,
    stripeSessionId: "PME-" + payment.id,
    pagarmeOrderId: payment.id,
    pagarmeChargeId: payment.chargeId ?? null,
    userId,
    email,
    resolvedNome,
    telefoneToSave,
    exp,
    slotData,
    dataFromPayload,
    horario,
    amountCents: amountToChargeCents,
    giftCardId,
    giftCardCentavos,
    cupomCode,
    couponId,
    couponDiscountCents,
    slotId,
    guardQty,
    fornecedorNome,
    fornecedorId,
    valorCheioFinal,
    valorRepasseCentavos,
    valorComissaoCentavos,
    repassesArray,
    metadata: { ...bookingMetadata, participantes },
  });

  if (!insertOk) {
    await rollback();
    return jsonResponse({ error: "booking_failed" }, 500);
  }

  console.info(
    "[Elarah Payment/Pagarme] booking pending + QR gerado",
    "booking=" + bookingId,
    "order=" + payment.id,
    "amount_cents=" + amountToChargeCents,
  );

  return jsonResponse({
    booking_id: bookingId,
    order_id: payment.id,
    charge_id: payment.chargeId,
    qr_code: qrCode,
    qr_code_url: qrCodeUrl,
    expires_at: payment.pix?.expiresAt,
    amount_total_centavos: amountToChargeCents,
    is_test: IS_TEST_KEY,
  });
}

// Insert com fallback pras colunas novas (pagarme_*) ausentes — mesmo
// princípio do fluxo do MP: se a migration ainda não rodou, grava sem
// elas e o metadata preserva os ids pro webhook reconciliar.
// deno-lint-ignore no-explicit-any
async function insertPendingBooking(p: any): Promise<boolean> {
  const baseRow: Record<string, unknown> = {
    id: p.bookingId,
    user_id: p.userId,
    email: p.email,
    nome: p.resolvedNome,
    telefone: p.telefoneToSave,
    experiencia_id: p.exp.id,
    experiencia_nome: p.exp.nome,
    data: p.slotData ?? p.dataFromPayload ?? p.exp.data ?? null,
    horario: p.horario,
    preco_label: p.exp.preco,
    amount_total: p.amountCents,
    currency: "brl",
    status: "pending",
    stripe_session_id: p.stripeSessionId,
    gift_card_id: p.giftCardId,
    gift_card_centavos: p.giftCardCentavos || null,
    gift_card_code: p.cupomCode,
    coupon_id: p.couponId,
    coupon_code: p.couponId ? p.cupomCode : null,
    coupon_discount_centavos: p.couponId ? p.couponDiscountCents : null,
    slot_id: p.slotId,
    quantidade: p.guardQty,
    fornecedor_nome: p.fornecedorNome,
    fornecedor_id: p.fornecedorId,
    valor_cheio_centavos: p.valorCheioFinal,
    valor_repasse_centavos: p.valorRepasseCentavos,
    valor_comissao_centavos: p.valorComissaoCentavos,
    repasses: p.repassesArray?.length ? p.repassesArray : null,
    status_fornecedor: "repasse_pendente",
    payment_provider: "pagarme",
    pagarme_order_id: p.pagarmeOrderId,
    pagarme_charge_id: p.pagarmeChargeId,
    metadata: p.metadata,
  };

  const { error } = await supabase.from("bookings").insert(baseRow);
  if (!error) return true;

  const msg = String(error.message || "").toLowerCase();
  const looksLikeNewColumnsMissing =
    (msg.includes("pagarme_order_id") || msg.includes("pagarme_charge_id") ||
      msg.includes("payment_provider")) &&
    (msg.includes("column") || msg.includes("schema cache"));
  if (looksLikeNewColumnsMissing) {
    console.warn(
      "[Elarah Payment/Pagarme] colunas pagarme_* ausentes — retry sem elas " +
        "(rode sql/elarah_bookings_pagarme.sql no Supabase)",
    );
    const retryRow = { ...baseRow };
    delete retryRow.pagarme_order_id;
    delete retryRow.pagarme_charge_id;
    delete retryRow.payment_provider;
    const { error: retryErr } = await supabase.from("bookings").insert(
      retryRow,
    );
    if (retryErr) {
      console.error("[Elarah Payment/Pagarme] retry insert falhou", retryErr);
      return false;
    }
    return true;
  }
  console.error("[Elarah Payment/Pagarme] booking insert error", error);
  return false;
}

serve(async (req) => {
  console.info(
    "[Elarah Payment/Pagarme] create-pagarme-pix-payment BOOT",
    "version=" + PIX_FN_VERSION,
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
      "[Elarah Payment/Pagarme] env ausente",
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

  const mode = String(payload.mode ?? "experience");
  try {
    if (mode === "gift_card") return await handleGiftCardPixRequest(payload);
    return await handlePixRequest(payload);
  } catch (e) {
    console.error(
      "[Elarah Payment/Pagarme] EXCEPTION inesperada — checkout PIX abortado",
      "version=" + PIX_FN_VERSION,
      "mode=" + mode,
      "error=" + (e instanceof Error ? e.message : String(e)),
      "stack=" + (e instanceof Error ? e.stack : "(no stack)"),
    );
    return jsonResponse({
      error: "checkout_unexpected_error",
      message: "Erro inesperado ao gerar o PIX. Tente novamente em instantes.",
    }, 500);
  }
});
