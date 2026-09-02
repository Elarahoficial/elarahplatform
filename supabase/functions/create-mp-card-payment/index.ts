// =============================================================
// ELARAH — create-mp-card-payment Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-mp-card-payment
//
// Cria um pagamento no CARTÃO via Mercado Pago. Suporta DOIS modos,
// escolhidos automaticamente pelo payload:
//
//   1) CHECKOUT TRANSPARENTE (Checkout API) — PREFERIDO / MODERNO
//      Ativado quando o front manda `token` (gerado pelo MercadoPago.js
//      V2 Secure Fields). O cliente digita o cartão DENTRO do site, sem
//      redirect. A gente cria o pagamento direto no /v1/payments com:
//        - token + payment_method_id + issuer_id + installments
//        - Device ID no header X-meli-session-id
//        - payer completo (email, nome, sobrenome, CPF, telefone, endereço)
//        - additional_info (items com description, payer)
//        - 3-D Secure 2 opcional
//      Resolve as pendências OBRIGATÓRIAS da Qualidade da Integração
//      (Secure Fields + Device ID) e as recomendadas (issuer_id, payer
//      fields, items.description).
//
//   2) CHECKOUT PRO (preference + redirect) — FALLBACK / COMPAT
//      Ativado quando NÃO vem `token` (ou o front não conseguiu montar
//      os Secure Fields por falta de public key / erro de SDK). Mantém
//      o comportamento antigo: cria uma preference e devolve init_point
//      pro front redirecionar. Garante que o cartão NUNCA quebra mesmo
//      que o fluxo transparente falhe.
//
// Em AMBOS os casos a confirmação vem pelo MESMO mp-webhook, que
// reconcilia a booking por external_reference == booking.id (igual PIX).
//
// NÃO substitui nem toca no fluxo de PIX nem no Stripe.
//
// Respostas (transparente):
//   200 { booking_id, payment_id, status, status_detail,
//         amount_total_centavos, three_ds?: {...} }
//   200 { direct: true, booking_id }          (cupom cobre 100%)
//   200 { rejected: true, status, status_detail, message }
//   4xx { error, message }
//   502 { error: "mp_create_failed", detail }
//
// Respostas (checkout pro):
//   200 { booking_id, preference_id, init_point, sandbox_init_point, ... }
//
// Variáveis de ambiente:
//   MP_CARD_ACCESS_TOKEN   (preferido — conta CNPJ do cartão)
//   MERCADO_PAGO_ACCESS_TOKEN (fallback)
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   PUBLIC_SITE_URL
//   CARD_FEE_PERCENT / CARD_FEE_FIXED_CENTS  (taxa repassada ao cliente)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { buildAcompanhantes } from "../_shared/acompanhantes.ts";
import {
  createCardPayment,
  createCheckoutPreference,
  type MPItemInfo,
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

// Token da conta que processa o CARTÃO. Usa MP_CARD_ACCESS_TOKEN se
// existir (conta CNPJ nova) e cai pro MERCADO_PAGO_ACCESS_TOKEN (a
// conta do PIX) só como fallback.
const MP_ACCESS_TOKEN =
  Deno.env.get("MP_CARD_ACCESS_TOKEN") ??
  Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ??
  "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const PUBLIC_SITE_URL =
  (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/+$/, "") ||
  "https://elarah.com.br";

// ===== Taxa do cartão (repasse pro cliente) — igual ao Stripe/Checkout Pro =====
function parseFeeEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (raw == null || raw === "") return fallback;
  const n = Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0) {
    console.warn(
      "[Elarah Payment/MP card] " + name + " inválido ('" + raw +
        "') — usando fallback " + fallback + " (sem quebrar o checkout).",
    );
    return fallback;
  }
  return n;
}
const CARD_FEE_PERCENT = parseFeeEnv("CARD_FEE_PERCENT", 0);
const CARD_FEE_FIXED_CENTS = parseFeeEnv("CARD_FEE_FIXED_CENTS", 0);

// Modo 3-D Secure 2. "optional" (recomendado) melhora a aprovação: a MP
// só pede o desafio quando o emissor exige. Escotilha: se a conta ainda
// não tem 3DS habilitado e a MP recusar o campo, basta setar
// MP_CARD_3DS_MODE=not_supported pra desligar sem tocar no código.
const CARD_3DS_MODE = (function (): "not_supported" | "optional" | "mandatory" {
  const raw = String(Deno.env.get("MP_CARD_3DS_MODE") ?? "optional").trim();
  if (raw === "not_supported" || raw === "mandatory") return raw;
  return "optional";
})();

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
  let feeTotalCents = feePercentCents + feeFixedCents;
  if (!Number.isFinite(feeTotalCents) || feeTotalCents < 0) feeTotalCents = 0;
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
const CARD_FN_VERSION = "v2-mp-card-checkout-transparente-2026-07-13";

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

// Telefone BR (só dígitos) → { areaCode, number } pro payer.phone.
function splitPhone(digitsRaw: string | null): { areaCode: string; number: string } | undefined {
  const d = String(digitsRaw || "").replace(/\D+/g, "");
  if (d.length < 10) return undefined;
  return { areaCode: d.slice(0, 2), number: d.slice(2) };
}

// ===============================================================
// Handler principal — parte compartilhada (guard, financeiro, taxa),
// depois ramifica entre transparente e Checkout Pro.
// ===============================================================
async function handleCardRequest(
  payload: Record<string, unknown>,
): Promise<Response> {
  // ===== Detecta o modo =====
  // Transparente quando vem `token` (MercadoPago.js Secure Fields).
  const cardToken = payload.token ? String(payload.token).trim() : "";
  const isTransparent = cardToken.length > 0;

  // ===== Parse do payload (comum aos dois modos) =====
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

  // ===== Aceite dos prazos de remarcação/cancelamento =====
  // Momento em que a cliente marcou o checkbox no checkout, mais o prazo
  // de remarcação que estava na tela naquele instante. Os dois vão pro
  // metadata da reserva: sem eles o checkbox seria enfeite, e a reserva
  // precisa carregar a prova de que a regra foi informada ANTES do
  // pagamento — senão todo pedido de última hora vira discussão sem lastro.
  //
  // O prazo é CONGELADO aqui de propósito. Mudar a regra de uma categoria
  // amanhã não pode reescrever o que esta cliente aceitou hoje, e é esse
  // número que o e-mail de confirmação exibe.
  //
  // Nada disso bloqueia a cobrança: a trava é no front, aqui é registro.
  // Valor implausível vira null e o e-mail cai no padrão de 48h.
  const politicaAceitaEm = (function () {
    const raw = payload.politica_aceita_em;
    if (!raw || typeof raw !== "string") return null;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) return null;
    return new Date(t).toISOString();
  })();
  const politicaRemarcacaoHoras = (function () {
    const n = Number(payload.politica_remarcacao_horas);
    // Teto de 30 dias: acima disso é payload adulterado, não regra nova.
    if (!Number.isFinite(n) || n <= 0 || n > 720) return null;
    return Math.round(n);
  })();
  // Preço unitário da variação exibido no front (centavos). Só dica —
  // o banco continua autoritativo. Ver booking_guard §5b.
  const variantExpectedCents = (function () {
    const n = Number(payload.variant_price_expected_centavos);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  })();

  // ===== Dados do cartão (só no modo transparente) =====
  const paymentMethodId = payload.payment_method_id ? String(payload.payment_method_id).trim() : "";
  const issuerId = payload.issuer_id ? String(payload.issuer_id).trim() : "";
  const installments = Math.max(1, Math.floor(Number(payload.installments) || 1));
  const deviceId = payload.device_id ? String(payload.device_id).trim() : "";
  const identificationType = payload.identification_type
    ? String(payload.identification_type).trim()
    : "CPF";

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
  if (isTransparent && !paymentMethodId) {
    return jsonResponse(
      { error: "payment_method_id_required", message: "Dados do cartão incompletos. Recarregue e tente novamente." },
      400,
    );
  }
  if (isTransparent && !deviceId) {
    // Não bloqueia (a MP aceita sem), mas registra — é uma pendência de
    // aprovação. O front DEVE mandar; se não veio, algo falhou no SDK.
    console.warn("[Elarah Payment/MP card] device_id ausente no pagamento transparente — aprovação pode cair");
  }

  // ===== Reserva slot =====
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
      acompanhantes: acompanhantes,
      metadata: {
        bairro: exp.bairro ?? null,
        endereco: exp.endereco ?? null,
        paid_with_gift_card_only: true,
        participantes: participantes,
        telefone_digits: telefoneDigits || null,
        payment_method: "card",
        cpf: cpfRaw || null,
        politica_aceita_em: politicaAceitaEm,
        politica_remarcacao_horas: politicaRemarcacaoHoras,
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

  // ===== Caso normal: cobra no cartão =====
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
  const feeInfo = applyCardFee(amountToChargeCents);
  const finalChargeCents = feeInfo.finalCents;
  console.info(
    "[Elarah Payment/MP card] taxa do cartão",
    "mode=" + (isTransparent ? "transparente" : "checkout_pro"),
    "base=" + amountToChargeCents,
    "fee_total=" + feeInfo.feeTotalCents,
    "final=" + finalChargeCents,
  );

  // Título/descrição do item (com description — pendência recomendada).
  const itemTitle = [exp.nome, exp.data, horario].filter(Boolean).join(" · ") || exp.nome;
  const itemDescription = [exp.nome, exp.bairro, exp.data, horario]
    .filter(Boolean).join(" · ") || exp.nome;
  const mpItems: MPItemInfo[] = [{
    id: bookingId,
    title: String(exp.nome).slice(0, 250),
    description: String(itemDescription).slice(0, 250),
    categoryId: "entertainment",
    quantity: 1,
    unitPriceCents: finalChargeCents,
  }];

  // Metadata comum do booking.
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
    payment_provider: "mercado_pago",
    politica_aceita_em: politicaAceitaEm,
    politica_remarcacao_horas: politicaRemarcacaoHoras,
    cpf: cpfRaw || null,
    inventory_skipped: inventorySkipped || undefined,
    variant_label: variantLabel || undefined,
    variant_selected: variantSelected || undefined,
  };

  // Insere a booking pending (com fallback pra colunas novas ausentes).
  // Reutilizado pelos dois modos.
  async function insertPendingBooking(
    stripeSessionId: string,
    mpPaymentId: string | null,
    extraMeta: Record<string, unknown>,
  ): Promise<{ ok: boolean }> {
    const fullMeta = { ...bookingMetadata, ...extraMeta, participantes };
    const baseRow: Record<string, unknown> = {
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
      stripe_session_id: stripeSessionId,
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
      acompanhantes: acompanhantes,
      metadata: fullMeta,
    };
    if (mpPaymentId) baseRow.mp_payment_id = mpPaymentId;

    const { error: insertErr } = await supabase.from("bookings").insert(baseRow);
    if (!insertErr) return { ok: true };

    const msg = String(insertErr.message || "").toLowerCase();
    const looksLikeNewColumnsMissing =
      (msg.includes("payment_provider") || msg.includes("mp_payment_id")) &&
      (msg.includes("column") || msg.includes("schema cache"));
    if (looksLikeNewColumnsMissing) {
      console.warn("[Elarah Payment/MP card] colunas novas ausentes — retry sem elas");
      const retryRow = { ...baseRow };
      delete retryRow.payment_provider;
      delete retryRow.mp_payment_id;
      const { error: retryErr } = await supabase.from("bookings").insert(retryRow);
      if (retryErr) {
        console.error("[Elarah Payment/MP card] retry insert falhou", retryErr);
        return { ok: false };
      }
      return { ok: true };
    }
    console.error("[Elarah Payment/MP card] booking insert error", insertErr);
    return { ok: false };
  }

  // =============================================================
  // MODO 1 — CHECKOUT TRANSPARENTE (/v1/payments com token)
  // =============================================================
  if (isTransparent) {
    const mpResult = await createCardPayment(MP_ACCESS_TOKEN, {
      transactionAmountCents: finalChargeCents,
      token: cardToken,
      paymentMethodId,
      installments,
      issuerId: issuerId || undefined,
      description: itemTitle.slice(0, 250),
      externalReference: bookingId,
      payerEmail: email,
      payerFirstName: firstName,
      payerLastName: lastName,
      payerCpf: cpfRaw,
      payerIdentificationType: identificationType,
      payerPhone: splitPhone(telefoneDigits),
      deviceId: deviceId || undefined,
      items: mpItems,
      statementDescriptor: "ELARAH",
      threeDSecureMode: CARD_3DS_MODE,
      notificationUrl: buildMpNotificationUrl(),
      idempotencyKey: bookingId,
    });

    if (!mpResult.ok || !mpResult.payment) {
      console.error(
        "[Elarah Payment/MP card] /v1/payments falhou, rollback",
        "status=" + mpResult.errorStatus,
        "body=" + JSON.stringify(mpResult.errorBody),
      );
      await rollback();
      return jsonResponse(
        {
          error: "mp_create_failed",
          message: "Não foi possível processar o cartão. Confira os dados ou pague no PIX.",
          detail: mpResult.errorBody,
        },
        502,
      );
    }

    const payment = mpResult.payment;
    const status = String(payment.status || "");
    const statusDetail = String(payment.status_detail || "");

    console.info(
      "[Elarah Payment/MP card] resultado transparente",
      "booking=" + bookingId,
      "payment=" + payment.id,
      "status=" + status,
      "status_detail=" + statusDetail,
      "installments=" + installments,
      "issuer=" + (issuerId || "?"),
    );

    // ----- Recusado / cancelado: libera estoque e devolve o motivo -----
    if (status === "rejected" || status === "cancelled") {
      await rollback();
      return jsonResponse({
        rejected: true,
        payment_id: String(payment.id),
        status,
        status_detail: statusDetail,
        message: "Pagamento recusado pelo emissor. Tente outro cartão ou pague no PIX.",
      });
    }

    // ----- Aprovado / em processamento / 3DS: grava booking pending -----
    // Mesmo aprovado, gravamos 'pending' e deixamos o mp-webhook (ou o
    // polling do front) marcar 'pago' e disparar os e-mails — igual PIX.
    // Isso evita e-mail duplicado e reaproveita toda a idempotência.
    const insertRes = await insertPendingBooking(
      "MPCARD-" + bookingId,
      String(payment.id),
      {
        mp_payment_id: String(payment.id),
        mp_status_inicial: status,
        mp_status_detail_inicial: statusDetail,
        mp_installments: installments,
        mp_issuer_id: issuerId || null,
        mp_payment_method_id: paymentMethodId,
        mp_device_id_sent: deviceId ? true : false,
      },
    );
    if (!insertRes.ok) {
      // A cobrança JÁ foi feita — não dá pra rollback do estoque sem
      // deixar pagamento órfão. Registra em alto volume pro admin.
      console.error(
        "[Elarah Payment/MP card] PAGAMENTO FEITO MAS BOOKING NÃO GRAVOU",
        "payment=" + payment.id,
        "booking=" + bookingId,
        "amount=" + finalChargeCents,
      );
      return jsonResponse(
        {
          error: "booking_failed_after_charge",
          payment_id: String(payment.id),
          message: "O pagamento foi processado, mas houve um erro ao registrar a reserva. " +
            "Guarde este código e nos chame no WhatsApp: " + bookingId,
        },
        500,
      );
    }

    const threeDs = payment.three_ds_info && payment.three_ds_info.external_resource_url
      ? {
        external_resource_url: payment.three_ds_info.external_resource_url,
        creq: payment.three_ds_info.creq,
      }
      : null;

    return jsonResponse({
      booking_id: bookingId,
      payment_id: String(payment.id),
      status,
      status_detail: statusDetail,
      amount_total_centavos: finalChargeCents,
      card_fee_total_centavos: feeInfo.feeTotalCents,
      is_test: IS_TEST_TOKEN,
      three_ds: threeDs,
    });
  }

  // =============================================================
  // MODO 2 — CHECKOUT PRO (preference + redirect) — fallback
  // =============================================================
  const stripeSessionIdPlaceholder = "MPCARD-" + bookingId;

  const preferenceInput = {
    items: [{
      title: itemTitle,
      description: itemDescription,
      categoryId: "entertainment",
      quantity: 1,
      unitPriceCents: finalChargeCents,
    }],
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
      "[Elarah Payment/MP card] preference falhou, rollback",
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

  const insertRes = await insertPendingBooking(
    stripeSessionIdPlaceholder,
    null,
    { mp_preference_id: preference.id },
  );
  if (!insertRes.ok) {
    await rollback();
    return jsonResponse({ error: "booking_failed" }, 500);
  }

  console.info(
    "[Elarah Payment/MP card] booking pending + preference (checkout pro)",
    "booking=" + bookingId,
    "preference=" + preference.id,
    "amount_cents=" + finalChargeCents,
  );

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
