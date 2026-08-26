// =============================================================
// ELARAH — create-pagarme-checkout Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-pagarme-checkout
//
// Cria uma order no Pagar.me (API V5) com CHECKOUT HOSPEDADO
// (cartão à vista + parcelado até 12x + Pix) e pré-grava a booking
// em status='pending'. Devolve a URL do checkout pro front redirecionar.
//
// Mesmo padrão de booking/estoque do create-mp-pix-payment: reserva o
// slot, calcula o mapa financeiro, pré-insere a reserva pending, e o
// pagarme-webhook marca 'pago' + dispara o e-mail na confirmação.
//
// Payload esperado (fluxo de experiência):
//   { experiencia_id, horario, data, slot_id, email, nome, cpf,
//     telefone, telefone_digits, cupom, quantidade, participantes,
//     variant_label, variant_selected }
//
// Respostas:
//   200 { booking_id, checkout_url, amount_total_centavos } | { direct:true }
//   4xx { error, message }
//   502 { error: "pagarme_create_failed", detail }
//
// Env:
//   PAGARME_SECRET_KEY            (sk_test_... / sk_...)
//   PAGARME_MAX_INSTALLMENTS      (default 12)
//   PAGARME_FREE_INSTALLMENTS     (parcelas sem juros; default 1)
//   PAGARME_MONTHLY_INTEREST      (juros a.m. repassado; default 0)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / PUBLIC_SITE_URL
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { sendDirectBookingConfirmation } from "../_shared/email.ts";
import { buildAcompanhantes } from "../_shared/acompanhantes.ts";
import { createPaymentLink } from "../_shared/pagarme.ts";
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
const PUBLIC_SITE_URL =
  (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/+$/, "") ||
  "https://elarah.com.br";

const MAX_INSTALLMENTS = Math.max(
  1,
  Math.min(12, Math.floor(Number(Deno.env.get("PAGARME_MAX_INSTALLMENTS")) || 12)),
);
// Parcelamento: o TOTAL de cada parcela é gross-up das taxas reais da conta
// (tabela centralizada em _shared/pagarme.ts → PAGARME_FEES). Não há mais
// juros genérico por env aqui.
// Expiração do PIX em SEGUNDOS (doc V5). Default 1h; mínimo 60s.
const PIX_EXPIRES_IN = Math.max(
  60,
  Math.floor(Number(Deno.env.get("PAGARME_PIX_EXPIRES_IN")) || 3600),
);

if (PAGARME_SECRET_KEY.startsWith("sk_test_")) {
  console.warn(
    "[Elarah Payment/Pagarme] ⚠ PAGARME_SECRET_KEY é de TESTE (sk_test_…). " +
      "Nenhuma cobrança real será feita.",
  );
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

// Primeiro nome = primeira palavra; sobrenome = resto (fallback ".").
function splitName(full: string): { first: string; last: string } {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Cliente", last: "Elarah" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
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
    return jsonResponse(
      { error: "email_required", message: "E-mail é obrigatório." },
      400,
    );
  }
  if (!isValidCpf(cpfRaw)) {
    return jsonResponse(
      { error: "cpf_required", message: "CPF inválido. Use 11 dígitos." },
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
    console.warn("[Elarah Payment/Pagarme] guard rejeitou", "code=" + guard.errorCode);
    return jsonResponse(
      { error: guard.errorCode, message: guard.errorMessage },
      guard.errorStatus,
    );
  }

  const {
    exp, userId, resolvedNome, baseCents, giftCardId, giftCardCentavos,
    couponId, couponDiscountCents, amountToChargeCents, slotId, slotData,
    quantidade: guardQty, fornecedorId, fornecedorNome, valorCheioCentavos,
    percentualRepasse, valorRepasseFixoCentavos, rollback,
  } = guard;

  // ===== Mapa financeiro (divisão com fornecedores) =====
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
    console.warn("[Elarah Payment/Pagarme] experience_suppliers exception", e);
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
        fornecedorNome,
        percentualRepasse,
        valorRepasseFixoCentavos: valorRepasseFixoCentavos != null
          ? Number(valorRepasseFixoCentavos) * guardQty
          : null,
      },
    )
    : null;

  const valorRepasseCentavos = breakdownFin ? breakdownFin.totalRepasseCentavos : null;
  const valorComissaoCentavos = breakdownFin ? breakdownFin.comissaoCentavos : null;
  const repassesArray = breakdownFin ? breakdownFin.repasses : [];

  // ===== Cupom cobre 100% — grava direto como pago (pula Pagar.me) =====
  if (amountToChargeCents === 0) {
    const directBookingId = crypto.randomUUID();
    // A reserva vira `pago` aqui mesmo (gift card cobre 100%), então o
    // webhook do provedor NUNCA dispara — e era ele que mandava a
    // confirmação. Guardamos a linha pra mandar o e-mail logo abaixo.
    const directRow = {
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
        telefone_digits: telefoneDigits || null, payment_method: "gift_card",
        cpf: cpfRaw, variant_label: variantLabel, variant_selected: variantSelected,
      },
    };
    const { error: directErr } = await supabase.from("bookings").insert(directRow);
    if (directErr) {
      console.error("[Elarah Payment/Pagarme] direct booking insert falhou", directErr);
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }
    // Confirmação pro cliente + aviso de venda pra Elarah. Não lança:
    // a reserva já está gravada, e-mail que falha não pode derrubar o checkout.
    await sendDirectBookingConfirmation(directRow);
    return jsonResponse({
      direct: true, booking_id: directBookingId, paid_with_gift_card: true,
      gift_card_centavos: giftCardCentavos,
    });
  }

  // ===== Caso normal: cria order no Pagar.me =====
  const bookingId = crypto.randomUUID();

  // Sanity check final — nunca cobrar a menos.
  const breakdown = computeChargeAmount(baseCents, guardQty, giftCardCentavos);
  try {
    assertExpectedTotal(breakdown, amountToChargeCents, "pagarme checkout");
  } catch (e) {
    console.error("[Elarah Payment/Pagarme] assertExpectedTotal falhou", e);
    await rollback();
    return jsonResponse({ error: "amount_mismatch" }, 500);
  }

  const itemTitle = (exp.nome || "Experiência Elarah") +
    (horario ? " · " + horario : "");
  const successUrl = PUBLIC_SITE_URL +
    "/success.html?provider=pagarme&booking_id=" + encodeURIComponent(bookingId);

  // Pré-insere a reserva pending ANTES de criar a order (external_reference).
  const { error: insertErr } = await supabase.from("bookings").insert({
    id: bookingId, user_id: userId, email, nome: resolvedNome,
    telefone: telefoneToSave, experiencia_id: exp.id, experiencia_nome: exp.nome,
    data: slotData ?? dataFromPayload ?? exp.data ?? null, horario,
    preco_label: exp.preco, amount_total: amountToChargeCents, currency: "brl",
    status: "pending", stripe_session_id: "PAGARME-" + bookingId.slice(0, 12),
    gift_card_id: giftCardId, gift_card_centavos: giftCardCentavos,
    gift_card_code: giftCardCentavos ? cupomCode : null, coupon_id: couponId,
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
      participantes, telefone_digits: telefoneDigits || null,
      payment_method: "card_or_pix", cpf: cpfRaw,
      variant_label: variantLabel, variant_selected: variantSelected,
    },
  });

  if (insertErr) {
    console.error("[Elarah Payment/Pagarme] booking pre-insert falhou", insertErr);
    await rollback();
    return jsonResponse(
      { error: "booking_save_failed", detail: insertErr.message },
      500,
    );
  }

  const phoneAreaCode = telefoneDigits ? telefoneDigits.slice(0, 2) : undefined;
  const phoneNumber = telefoneDigits ? telefoneDigits.slice(2) : undefined;

  const result = await createPaymentLink(PAGARME_SECRET_KEY, {
    amountCents: amountToChargeCents,
    description: itemTitle.slice(0, 250),
    externalReference: bookingId,
    customer: {
      name: resolvedNome || "Cliente Elarah",
      email,
      cpf: cpfRaw,
      phone: { areaCode: phoneAreaCode, number: phoneNumber },
    },
    items: [{
      description: itemTitle.slice(0, 250),
      amountCents: amountToChargeCents,
      quantity: 1,
      code: exp.id,
    }],
    successUrl,
    statementDescriptor: "ELARAH",
    maxInstallments: MAX_INSTALLMENTS,
    pixExpiresInSeconds: PIX_EXPIRES_IN,
  });

  if (!result.ok || !result.checkoutUrl) {
    console.error(
      "[Elarah Payment/Pagarme] order falhou, rollback",
      "status=" + result.errorStatus,
      "body=" + JSON.stringify(result.errorBody),
    );
    // Cancela a booking pending + libera estoque/cupom.
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    await rollback();
    return jsonResponse(
      {
        error: "pagarme_create_failed",
        message: "Não foi possível iniciar o pagamento. Tente novamente ou pague no PIX.",
        detail: result.errorBody,
      },
      502,
    );
  }

  // Guarda o payment link id no metadata pra reconciliação.
  await supabase
    .from("bookings")
    .update({
      mp_payment_id: result.paymentLink?.id ?? null,
      metadata: {
        bairro: exp.bairro ?? null, endereco: exp.endereco ?? null,
        participantes, telefone_digits: telefoneDigits || null,
        payment_method: "card_or_pix", cpf: cpfRaw,
        variant_label: variantLabel, variant_selected: variantSelected,
        pagarme_payment_link_id: result.paymentLink?.id ?? null,
      },
    })
    .eq("id", bookingId);

  console.info(
    "[Elarah Payment/Pagarme] checkout criado",
    "booking=" + bookingId,
    "payment_link=" + (result.paymentLink?.id ?? "?"),
    "amount=" + amountToChargeCents,
  );

  return jsonResponse({
    booking_id: bookingId,
    checkout_url: result.checkoutUrl,
    amount_total_centavos: amountToChargeCents,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
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
    console.error("[Elarah Payment/Pagarme] EXCEPTION inesperada", e);
    return jsonResponse({ error: "internal_error", detail: String(e) }, 500);
  }
});
