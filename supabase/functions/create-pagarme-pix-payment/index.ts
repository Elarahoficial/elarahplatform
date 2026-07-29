// =============================================================
// ELARAH — create-pagarme-pix-payment Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-pagarme-pix-payment
//
// PIX transparente via Pagar.me (Orders API). Cria a Order com PIX no
// VALOR-BASE (o PIX nunca leva gross-up), pré-grava a booking pending e
// devolve o QR (copia-e-cola + imagem) pro modal exibir inline — sem
// redirect. A confirmação vem pelo MESMO pagarme-webhook (order.code ==
// booking.id), igual ao cartão.
//
// Espelha create-mp-pix-payment (guard, financeiro, cupom 100%, insert),
// trocando o gateway. NÃO toca em webhook/booking/estoque/e-mails.
//
// Respostas:
//   200 { booking_id, order_id, qr_code, qr_code_url, amount_total_centavos }
//   200 { direct: true, booking_id }        (cupom cobre 100%)
//   4xx { error, message }
//   502 { error: "pagarme_create_failed", detail }
//
// Env: PAGARME_SECRET_KEY, PAGARME_PIX_EXPIRES_IN (opcional),
//      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { buildAcompanhantes } from "../_shared/acompanhantes.ts";
import { createPixOrder } from "../_shared/pagarme.ts";
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
const PIX_EXPIRES_IN = Math.max(
  60,
  Math.floor(Number(Deno.env.get("PAGARME_PIX_EXPIRES_IN")) || 3600),
);

const PIX_FN_VERSION = "v1-pagarme-pix-transparente-2026-07-28";

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
  // Acompanhantes → coluna dedicada `acompanhantes` (jsonb) da bookings.
  // [{ nome, telefone(dígitos, DDD+número) }]. Ver _shared/acompanhantes.ts.
  const acompanhantes = buildAcompanhantes(payload, participantes);
  const variantLabel = payload.variant_label ? String(payload.variant_label).trim() : null;
  const variantSelected = payload.variant_selected ? String(payload.variant_selected).trim() : null;
  const variantExpectedCents = (function () {
    const n = Number(payload.variant_price_expected_centavos);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  })();

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
    return jsonResponse({ error: "email_required", message: "E-mail é obrigatório pra PIX." }, 400);
  }
  if (!isValidCpf(cpfRaw)) {
    return jsonResponse(
      { error: "cpf_required", message: "CPF inválido. Use 11 dígitos." },
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
    console.warn("[Elarah Payment/Pagarme PIX] guard rejeitou", "code=" + guard.errorCode);
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
    console.warn("[Elarah Payment/Pagarme PIX] experience_suppliers exception", e);
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

  // ===== Cupom cobre 100% — grava direto pago =====
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
      acompanhantes: acompanhantes,
      metadata: {
        bairro: exp.bairro ?? null, endereco: exp.endereco ?? null,
        paid_with_gift_card_only: true, participantes,
        telefone_digits: telefoneDigits || null, payment_method: "pix",
        cpf: cpfRaw, variant_label: variantLabel, variant_selected: variantSelected,
      },
    });
    if (directErr) {
      console.error("[Elarah Payment/Pagarme PIX] direct booking insert falhou", directErr);
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }
    return jsonResponse({
      direct: true, booking_id: directBookingId, paid_with_gift_card: true,
      gift_card_centavos: giftCardCentavos,
    });
  }

  // ===== Caso normal: cria Order PIX (valor-base) =====
  const bookingId = crypto.randomUUID();
  const breakdown = computeChargeAmount(baseCents, guardQty, giftCardCentavos);
  try {
    assertExpectedTotal(breakdown, amountToChargeCents, "pagarme pix");
  } catch (e) {
    console.error("[Elarah Payment/Pagarme PIX] assertExpectedTotal falhou", e);
    await rollback();
    return jsonResponse({ error: "amount_mismatch" }, 500);
  }

  const itemTitle = (exp.nome || "Experiência Elarah") + (horario ? " · " + horario : "");
  const phoneAreaCode = telefoneDigits ? telefoneDigits.slice(0, 2) : undefined;
  const phoneNumber = telefoneDigits ? telefoneDigits.slice(2) : undefined;

  const pixResult = await createPixOrder(PAGARME_SECRET_KEY, {
    amountCents: amountToChargeCents, // valor-base
    bookingId,
    description: itemTitle.slice(0, 64),
    customer: {
      name: resolvedNome || "Cliente Elarah",
      email: email!,
      cpf: cpfRaw,
      phone: { areaCode: phoneAreaCode, number: phoneNumber },
    },
    pixExpiresInSeconds: PIX_EXPIRES_IN,
    itemCode: exp.id,
  });

  if (!pixResult.ok || !pixResult.qrCode) {
    // Diagnóstico REAL: o log antigo mostrava só errorStatus/errorBody, que
    // NÃO existem quando a Order é criada (ok=true) mas vem SEM QR — daí o
    // "status=undefined body=undefined". Aqui distinguimos os casos e
    // expomos a resposta crua do Pagar.me (status/charge/tx + gateway_response
    // + request_id), onde aparece, p.ex., "PIX não habilitado". Sem secrets.
    // deno-lint-ignore no-explicit-any
    const order = (pixResult.order ?? null) as any;
    const charge = order?.charges?.[0] ?? null;
    const tx = charge?.last_transaction ?? null;
    console.error(
      "[Elarah Payment/Pagarme PIX] order pix sem QR / falhou",
      "ok=" + pixResult.ok,
      "http=" + (pixResult.errorStatus ?? (pixResult.ok ? "2xx" : "n/a")),
      "order_id=" + (pixResult.orderId ?? "?"),
      "order_status=" + (pixResult.orderStatus ?? "?"),
      "charge_status=" + (charge?.status ?? "?"),
      "tx_status=" + (tx?.status ?? "?"),
      "acquirer_message=" + (tx?.acquirer_message ?? "?"),
      "gateway_response=" + JSON.stringify(tx?.gateway_response ?? null),
      "request_id=" + (order?.gateway_response?.request_id ?? tx?.gateway_id ?? "?"),
      "qr_present=" + (pixResult.qrCode ? "yes" : "no"),
      "errorBody=" + JSON.stringify(pixResult.errorBody ?? null),
    );
    await rollback();
    return jsonResponse(
      {
        error: "pagarme_create_failed",
        message: "Não foi possível gerar o PIX. Tente novamente ou pague no cartão.",
        detail: pixResult.errorBody ?? null,
      },
      502,
    );
  }

  // ===== Grava booking pending (amount = valor-base) =====
  const { error: insertErr } = await supabase.from("bookings").insert({
    id: bookingId, user_id: userId, email, nome: resolvedNome,
    telefone: telefoneToSave, experiencia_id: exp.id, experiencia_nome: exp.nome,
    data: slotData ?? dataFromPayload ?? exp.data ?? null, horario,
    preco_label: exp.preco, amount_total: amountToChargeCents, currency: "brl",
    status: "pending", stripe_session_id: "PAGARME-PIX-" + bookingId.slice(0, 12),
    gift_card_id: giftCardId, gift_card_centavos: giftCardCentavos || null,
    gift_card_code: cupomCode, coupon_id: couponId,
    coupon_code: couponId ? cupomCode : null,
    coupon_discount_centavos: couponId ? couponDiscountCents : null,
    slot_id: slotId, quantidade: guardQty, fornecedor_nome: fornecedorNome,
    fornecedor_id: fornecedorId, valor_cheio_centavos: valorCheioFinal,
    valor_repasse_centavos: valorRepasseCentavos, valor_comissao_centavos: valorComissaoCentavos,
    repasses: repassesArray.length ? repassesArray : null,
    status_fornecedor: "repasse_pendente", mp_payment_id: pixResult.orderId ?? null,
    payment_provider: "pagarme",
    acompanhantes: acompanhantes,
    metadata: {
      bairro: exp.bairro ?? null, endereco: exp.endereco ?? null,
      participantes, telefone_digits: telefoneDigits || null,
      payment_method: "pix", cpf: cpfRaw,
      variant_label: variantLabel, variant_selected: variantSelected,
      pagarme_order_id: pixResult.orderId ?? null,
      inventory_skipped: inventorySkipped || undefined,
    },
  });

  if (insertErr) {
    // A Order PIX foi criada, mas não conseguimos gravar a booking. Não dá
    // rollback do gateway aqui (PIX ainda não foi pago) — registra alto.
    console.error("[Elarah Payment/Pagarme PIX] booking insert falhou", insertErr);
    await rollback();
    return jsonResponse({ error: "booking_failed", detail: insertErr.message }, 500);
  }

  console.info(
    "[Elarah Payment/Pagarme PIX] booking pending + QR",
    "booking=" + bookingId, "order=" + pixResult.orderId, "amount=" + amountToChargeCents,
  );

  return jsonResponse({
    booking_id: bookingId,
    order_id: pixResult.orderId,
    qr_code: pixResult.qrCode, // copia-e-cola
    qr_code_url: pixResult.qrCodeUrl ?? null, // imagem do QR
    amount_total_centavos: amountToChargeCents,
  });
}

serve(async (req) => {
  console.info("[Elarah Payment/Pagarme PIX] BOOT", "version=" + PIX_FN_VERSION, "method=" + req.method);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  try {
    return await handleRequest(payload);
  } catch (e) {
    console.error("[Elarah Payment/Pagarme PIX] EXCEPTION", e);
    return jsonResponse(
      { error: "checkout_unexpected_error", message: "Erro inesperado ao gerar o PIX. Tente novamente ou pague no cartão." },
      500,
    );
  }
});
