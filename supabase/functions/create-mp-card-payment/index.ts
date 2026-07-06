// =============================================================
// ELARAH — create-mp-card-payment Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-mp-card-payment
//
// Cria uma preferência de Checkout Pro (Mercado Pago) pro cliente
// pagar no CARTÃO — com parcelamento em até 12x, juros repassados
// ao cliente (regra da Elarah). Pré-grava a booking em
// status='pending' e devolve o `init_point` pro frontend redirecionar.
//
// Espelha create-mp-pix-payment (mesma validação, booking_guard,
// mapa financeiro e pré-insert), MAS:
//   - não exige CPF (a MP coleta os dados do cartão na página dela);
//   - em vez de gerar QR, cria uma preference e redireciona;
//   - a confirmação vem pelo MESMO mp-webhook, que reconcilia a
//     booking por external_reference == booking.id. Nenhuma mudança
//     no webhook é necessária.
//
// NÃO substitui nem toca no fluxo de PIX nem no Stripe. É aditivo.
//
// Payload esperado (igual ao do PIX, cpf opcional):
//   {
//     "experiencia_id": "uuid",
//     "horario":        "19h00 – 22h30",
//     "email":          "cliente@dominio",
//     "nome":           "Maria Silva",
//     "telefone":       "(11) 91234-5678",
//     "cupom":          "ELRH-..." | null,
//     "quantidade":     1
//   }
//
// Respostas:
//   200 { booking_id, preference_id, init_point, sandbox_init_point,
//         amount_total_centavos, direct?: true }
//   4xx { error, message }
//   502 { error: "mp_create_failed", detail }
//
// Variáveis de ambiente (as MESMAS já usadas pelo PIX):
//   MERCADO_PAGO_ACCESS_TOKEN
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   PUBLIC_SITE_URL              (back_urls / notification_url)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { createCheckoutPreference } from "../_shared/mercadopago.ts";
import {
  reserveExperienceSlot,
  computeChargeAmount,
  assertExpectedTotal,
} from "../_shared/booking_guard.ts";
import {
  computeFinancialBreakdown,
  type SupplierRow,
} from "../_shared/financial.ts";

// Token da conta que processa o CARTÃO. Usa MP_CARD_ACCESS_TOKEN se
// existir (conta CNPJ nova) e cai pro MERCADO_PAGO_ACCESS_TOKEN (a
// conta do PIX) só como fallback. Isso permite rodar o cartão numa
// conta e o PIX em outra AO MESMO TEMPO — o PIX nunca é afetado quando
// só o MP_CARD_ACCESS_TOKEN é configurado.
const MP_ACCESS_TOKEN =
  Deno.env.get("MP_CARD_ACCESS_TOKEN") ??
  Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ??
  "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const PUBLIC_SITE_URL =
  (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/+$/, "") ||
  "https://elarah.com.br";

// ===== Taxa do cartão (repasse pro cliente) =====
// MESMAS envs que o fluxo do Stripe (create-checkout-session) usa —
// já estão configuradas no Supabase. Assim o cartão via Mercado Pago
// cobra a MESMA taxa que o cartão via Stripe cobrava, repassada ao
// cliente inclusive no à vista. O PIX NÃO usa isso (preço limpo).
const CARD_FEE_PERCENT = Number(Deno.env.get("CARD_FEE_PERCENT") ?? "0");
const CARD_FEE_FIXED_CENTS = Number(Deno.env.get("CARD_FEE_FIXED_CENTS") ?? "0");

// final = base + round(base * percent/100) + fixed  (idêntico ao Stripe)
function applyCardFee(baseCents: number): {
  finalCents: number;
  feePercentCents: number;
  feeFixedCents: number;
  feeTotalCents: number;
} {
  if (!Number.isFinite(baseCents) || baseCents <= 0) {
    return { finalCents: baseCents, feePercentCents: 0, feeFixedCents: 0, feeTotalCents: 0 };
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

const IS_TEST_TOKEN = MP_ACCESS_TOKEN.startsWith("TEST-");

// Marcador de versão — confirme nos logs do Supabase qual versão está
// ativa ao testar uma reserva.
const CARD_FN_VERSION = "v1-mp-card-checkout-pro-2026-07-05";

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

function splitName(fullName: string): { first: string; last: string } {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Cliente", last: "Elarah" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

async function handleCardRequest(
  payload: Record<string, unknown>,
): Promise<Response> {
  // ===== Parse do payload (espelha o PIX) =====
  const experienciaId = String(payload.experiencia_id ?? "").trim();
  const horario = payload.horario ? String(payload.horario).trim() : null;
  const dataFromPayload = payload.data ? String(payload.data).trim() : null;
  const slotIdFromPayload = payload.slot_id ? String(payload.slot_id).trim() : null;
  const email = payload.email ? String(payload.email).trim() : null;
  const nomeFromPayload = payload.nome ? String(payload.nome).trim() : null;
  const cupomCode = payload.cupom ? String(payload.cupom).trim() : null;
  // CPF é OPCIONAL no cartão — a MP coleta na página dela. Se vier,
  // repassamos pra pré-preencher.
  const cpfRaw = String(payload.cpf ?? "").replace(/\D+/g, "");
  const quantidade = Math.max(1, Math.floor(Number(payload.quantidade) || 1));
  const participantes = Array.isArray(payload.participantes) ? payload.participantes : [];
  const variantLabel = payload.variant_label ? String(payload.variant_label).trim() : null;
  const variantSelected = payload.variant_selected ? String(payload.variant_selected).trim() : null;

  const telefoneHuman = payload.telefone ? String(payload.telefone).trim() : null;
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
      { error: "email_required", message: "E-mail é obrigatório." },
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
  });

  if (!guard.ok) {
    console.warn(
      "[Elarah Payment/MP card] guard rejeitou",
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

  // ===== Cálculo financeiro (mapa de divisão) — idêntico ao PIX =====
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
        "[Elarah Payment/MP card] experience_suppliers lookup falhou — fallback no legado",
        supErr.message,
      );
    } else if (Array.isArray(supRows)) {
      suppliers = supRows as SupplierRow[];
    }
  } catch (e) {
    console.warn("[Elarah Payment/MP card] experience_suppliers exception", e);
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
          valorRepasseFixoCentavos: valorRepasseFixoCentavos != null
            ? Number(valorRepasseFixoCentavos) * guardQty
            : null,
        },
      )
    : null;

  const valorRepasseCentavos = breakdownFin ? breakdownFin.totalRepasseCentavos : null;
  const valorComissaoCentavos = breakdownFin ? breakdownFin.comissaoCentavos : null;
  const repassesArray = breakdownFin ? breakdownFin.repasses : [];

  // ===== CASO especial: cupom cobre 100% — pula MP =====
  // Idêntico ao PIX: grava direto como pago, nenhum pagamento criado.
  if (amountToChargeCents === 0) {
    const directBookingId = crypto.randomUUID();
    const { error: directErr } = await supabase.from("bookings").insert({
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
      metadata: {
        bairro: exp.bairro ?? null,
        endereco: exp.endereco ?? null,
        paid_with_gift_card_only: true,
        participantes: participantes,
        telefone_digits: telefoneDigits || null,
        payment_method: "card",
        cpf: cpfRaw || null,
      },
    });

    if (directErr) {
      console.error("[Elarah Payment/MP card] direct booking insert falhou", directErr);
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }

    console.info(
      "[Elarah Payment/MP card] booking gratuita via cupom 100%",
      "booking=" + directBookingId,
    );
    return jsonResponse({
      direct: true,
      booking_id: directBookingId,
      paid_with_gift_card: true,
      gift_card_centavos: giftCardCentavos,
    });
  }

  // ===== Caso normal: criar preferência de Checkout Pro =====
  // Reserva booking_id ANTES de chamar a MP pra usar como
  // external_reference (o webhook reconcilia por bookings.id == ref).
  const bookingId = crypto.randomUUID();
  const { first: firstName, last: lastName } = splitName(resolvedNome || "Cliente Elarah");

  // Sanity check: nunca cobramos a menos.
  const breakdown = computeChargeAmount(baseCents, guardQty, giftCardCentavos);
  try {
    assertExpectedTotal(breakdown, amountToChargeCents, "mp card payment");
  } catch (e) {
    console.error("[Elarah Payment/MP card] assertExpectedTotal falhou", e);
    await rollback();
    return jsonResponse(
      { error: "amount_mismatch", message: "Erro interno no cálculo do total. Recarregue e tente novamente." },
      500,
    );
  }

  // ===== Taxa do cartão repassada ao cliente =====
  // amountToChargeCents é o preço "limpo" (base − desconto). No cartão,
  // somamos a taxa de processamento por cima — igual o Stripe fazia —
  // pra a Elarah não arcar com a taxa (inclusive no à vista). O
  // parcelamento (juros) que a MP mostra é aplicado SOBRE este total.
  const feeInfo = applyCardFee(amountToChargeCents);
  const finalChargeCents = feeInfo.finalCents;
  console.info(
    "[Elarah Payment/MP card] taxa do cartão",
    "base=" + amountToChargeCents,
    "fee_percent=" + feeInfo.feePercentCents,
    "fee_fixed=" + feeInfo.feeFixedCents,
    "fee_total=" + feeInfo.feeTotalCents,
    "final=" + finalChargeCents,
  );

  // stripe_session_id é UNIQUE; usamos "MPCARD-<bookingId>" como
  // placeholder. Esse MESMO valor vai no back_url de sucesso
  // (?session_id=MPCARD-<id>), então a success.html localiza a booking
  // pela coluna stripe_session_id e mostra o status (Pago/Processando).
  const stripeSessionIdPlaceholder = "MPCARD-" + bookingId;

  // Item único com o valor final (preço − desconto + taxa do cartão).
  // Mandamos 1 item com quantity=1 e unit_price = finalChargeCents, pra
  // o valor cobrado bater EXATAMENTE com o total (com taxa repassada).
  const preferenceInput = {
    items: [
      {
        title: [exp.nome, exp.data, horario].filter(Boolean).join(" · ") || exp.nome,
        quantity: 1,
        unitPriceCents: finalChargeCents,
      },
    ],
    externalReference: bookingId,
    payerEmail: email,
    payerFirstName: firstName,
    payerLastName: lastName,
    payerCpf: cpfRaw || undefined,
    notificationUrl: buildMpNotificationUrl(),
    backUrls: {
      success: PUBLIC_SITE_URL + "/success.html?session_id=" +
        encodeURIComponent(stripeSessionIdPlaceholder),
      pending: PUBLIC_SITE_URL + "/success.html?session_id=" +
        encodeURIComponent(stripeSessionIdPlaceholder),
      failure: PUBLIC_SITE_URL + "/cancel.html",
    },
    maxInstallments: 12,
    statementDescriptor: "ELARAH",
    metadata: {
      booking_id: bookingId,
      experiencia_id: exp.id,
      quantidade: guardQty,
    },
    expiresInMinutes: 30,
    idempotencyKey: bookingId,
  };

  const mpResult = await createCheckoutPreference(MP_ACCESS_TOKEN, preferenceInput);

  if (!mpResult.ok || !mpResult.preference) {
    console.error(
      "[Elarah Payment/MP card] MP retornou erro, fazendo rollback",
      "status=" + mpResult.errorStatus,
      "body=" + JSON.stringify(mpResult.errorBody),
    );
    await rollback();
    return jsonResponse(
      {
        error: "mp_create_failed",
        message: "Não foi possível iniciar o pagamento no cartão. Tente novamente ou pague no PIX.",
        detail: mpResult.errorBody,
      },
      502,
    );
  }

  const preference = mpResult.preference;

  // ===== Grava booking pending =====
  const bookingMetadata = {
    bairro: exp.bairro ?? null,
    endereco: exp.endereco ?? null,
    telefone_digits: telefoneDigits || null,
    unit_price_centavos: breakdown.unitCents,
    subtotal_centavos: breakdown.subtotalCents,
    discount_centavos: breakdown.discountCents,
    total_after_discount_centavos: breakdown.totalCents,
    preco_total_centavos: breakdown.subtotalCents,
    // Taxa do cartão repassada ao cliente (por cima do preço limpo).
    card_fee_percent_centavos: feeInfo.feePercentCents,
    card_fee_fixed_centavos: feeInfo.feeFixedCents,
    card_fee_total_centavos: feeInfo.feeTotalCents,
    amount_before_fee_centavos: amountToChargeCents,
    payment_method: "card",
    payment_provider: "mercado_pago",
    cpf: cpfRaw || null,
    mp_preference_id: preference.id,
    inventory_skipped: inventorySkipped || undefined,
    variant_label: variantLabel || undefined,
    variant_selected: variantSelected || undefined,
  };

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
    amount_total: finalChargeCents,
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
    payment_provider: "mercado_pago",
    metadata: { ...bookingMetadata, participantes },
  });

  if (insertErr) {
    // Fallback: se as colunas novas (payment_provider) ainda não
    // existirem, tenta sem elas — o metadata preserva o rastro.
    const msg = String(insertErr.message || "").toLowerCase();
    const looksLikeNewColumnsMissing =
      (msg.includes("payment_provider") || msg.includes("mp_payment_id")) &&
      (msg.includes("column") || msg.includes("schema cache"));
    if (looksLikeNewColumnsMissing) {
      console.warn(
        "[Elarah Payment/MP card] coluna payment_provider ausente — retry sem ela",
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
        amount_total: finalChargeCents,
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
        metadata: { ...bookingMetadata, participantes },
      });
      if (retryErr) {
        console.error("[Elarah Payment/MP card] retry insert falhou", retryErr);
        await rollback();
        return jsonResponse({ error: "booking_failed" }, 500);
      }
    } else {
      console.error("[Elarah Payment/MP card] booking insert error", insertErr);
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }
  }

  console.info(
    "[Elarah Payment/MP card] booking pending + preference criada",
    "booking=" + bookingId,
    "preference=" + preference.id,
    "amount_cents=" + finalChargeCents,
    "(base=" + amountToChargeCents + " + fee=" + feeInfo.feeTotalCents + ")",
  );

  // Em TESTE (credenciais TEST-), o front deve usar sandbox_init_point.
  // Devolvemos os dois — o front decide.
  return jsonResponse({
    booking_id: bookingId,
    preference_id: preference.id,
    init_point: preference.init_point,
    sandbox_init_point: preference.sandbox_init_point,
    is_test: IS_TEST_TOKEN,
    amount_total_centavos: finalChargeCents,
    card_fee_total_centavos: feeInfo.feeTotalCents,
  });
}

// =============================================================
// ENTRY
// =============================================================
serve(async (req) => {
  console.info(
    "[Elarah Payment/MP card] create-mp-card-payment BOOT",
    "version=" + CARD_FN_VERSION,
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
      "[Elarah Payment/MP card] env ausente",
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

  // Defesa final: qualquer exceção vira erro nomeado + mensagem PT.
  try {
    return await handleCardRequest(payload);
  } catch (e) {
    console.error(
      "[Elarah Payment/MP card] EXCEPTION inesperada — checkout cartão abortado",
      "version=" + CARD_FN_VERSION,
      "error=" + (e instanceof Error ? e.message : String(e)),
      "stack=" + (e instanceof Error ? e.stack : "(no stack)"),
    );
    return jsonResponse(
      {
        error: "checkout_unexpected_error",
        message:
          "Erro inesperado ao iniciar o pagamento. Tente novamente em instantes ou pague no PIX.",
      },
      500,
    );
  }
});
