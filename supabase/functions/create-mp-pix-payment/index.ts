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
import {
  createPixPayment,
  isValidCpf,
} from "../_shared/mercadopago.ts";
import { reserveExperienceSlot } from "../_shared/booking_guard.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
 claude/show-buyer-name-admin-secEZ
const PUBLIC_SITE_URL =
  (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/+$/, "") ||
  "https://elarah.com.br";

// Notification URL é a URL pública da nossa função mp-webhook.
// Supabase Edge Functions sempre estão em
// https://<project>.supabase.co/functions/v1/<name>
=======

// Notification URL é a URL pública da nossa função mp-webhook.
 claude/create-elarah-homepage-VsE5i
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

serve(async (req) => {
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

  // ===== Parse do payload =====
  const experienciaId = String(payload.experiencia_id ?? "").trim();
  const horario = payload.horario ? String(payload.horario).trim() : null;
  const email = payload.email ? String(payload.email).trim() : null;
  const nomeFromPayload = payload.nome ? String(payload.nome).trim() : null;
  const cupomCode = payload.cupom ? String(payload.cupom).trim() : null;
  const cpfRaw = String(payload.cpf ?? "").replace(/\D+/g, "");

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
    email,
    nome: nomeFromPayload,
    cupomCode,
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
    amountToChargeCents,
    rollback,
  } = guard;

  // ===== CASO especial: cupom cobre 100% — pula MP =====
 claude/show-buyer-name-admin-secEZ
  // Fluxo idêntico ao que create-checkout-session faz: grava direto
  // como pago, nenhum pagamento é criado na MP.

 claude/create-elarah-homepage-VsE5i
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
      data: exp.data ?? null,
      horario: horario,
      preco_label: exp.preco,
      amount_total: 0,
      currency: "brl",
      status: "pago",
      stripe_session_id: "MP-GIFT-" + directBookingId.slice(0, 12),
      gift_card_id: giftCardId,
      gift_card_centavos: giftCardCentavos,
      gift_card_code: cupomCode,
      payment_provider: "mercado_pago",
      metadata: {
        bairro: exp.bairro ?? null,
        endereco: exp.endereco ?? null,
        paid_with_gift_card_only: true,
        telefone_digits: telefoneDigits || null,
        payment_method: "pix",
        cpf: cpfRaw,
      },
    });

    if (directErr) {
      console.error("[Elarah Payment/MP] direct booking insert falhou", directErr);
      await rollback();
      return jsonResponse({ error: "booking_failed" }, 500);
    }

    console.info(
      "[Elarah Payment/MP] booking gratuita via cupom 100%",
      "booking=" + directBookingId,
    );
    return jsonResponse({
      direct: true,
      booking_id: directBookingId,
      paid_with_gift_card: true,
      gift_card_centavos: giftCardCentavos,
    });
  }

  // ===== Caso normal: criar pagamento PIX na MP =====
 claude/show-buyer-name-admin-secEZ
  // Reserva booking_id ANTES de chamar a MP pra poder usar como
  // external_reference — facilita reconciliação.
=======
 claude/create-elarah-homepage-VsE5i
  const bookingId = crypto.randomUUID();
  const { first: firstName, last: lastName } = splitName(resolvedNome || "Cliente Elarah");

  const mpResult = await createPixPayment(MP_ACCESS_TOKEN, {
    transactionAmountCents: amountToChargeCents,
    description: [exp.nome, exp.data, horario].filter(Boolean).join(" · ").slice(0, 250),
    externalReference: bookingId,
    payerEmail: email,
    payerFirstName: firstName,
    payerLastName: lastName,
    payerCpf: cpfRaw,
    expiresInMinutes: 30,
    notificationUrl: buildMpNotificationUrl(),
 claude/show-buyer-name-admin-secEZ
    idempotencyKey: bookingId, // garante idempotência por booking

    idempotencyKey: bookingId,
 claude/create-elarah-homepage-VsE5i
  });

  if (!mpResult.ok || !mpResult.payment) {
    console.error(
      "[Elarah Payment/MP] MP retornou erro, fazendo rollback",
      "status=" + mpResult.errorStatus,
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

  if (!qrCode || !qrCodeBase64) {
    console.error(
      "[Elarah Payment/MP] resposta sem QR code",
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

  // ===== Grava booking pending =====
  const bookingMetadata = {
    bairro: exp.bairro ?? null,
    endereco: exp.endereco ?? null,
    telefone_digits: telefoneDigits || null,
    preco_total_centavos: baseCents,
    payment_method: "pix",
    payment_provider: "mercado_pago",
    cpf: cpfRaw,
    mp_payment_id: String(payment.id),
    mp_expires_at: payment.date_of_expiration,
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
    data: exp.data ?? null,
    horario: horario,
    preco_label: exp.preco,
    amount_total: amountToChargeCents,
    currency: "brl",
    status: "pending",
    stripe_session_id: stripeSessionIdPlaceholder,
    gift_card_id: giftCardId,
    gift_card_centavos: giftCardCentavos || null,
    gift_card_code: cupomCode,
    mp_payment_id: String(payment.id),
    payment_provider: "mercado_pago",
    metadata: bookingMetadata,
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
        data: exp.data ?? null,
        horario: horario,
        preco_label: exp.preco,
        amount_total: amountToChargeCents,
        currency: "brl",
        status: "pending",
        stripe_session_id: stripeSessionIdPlaceholder,
        gift_card_id: giftCardId,
        gift_card_centavos: giftCardCentavos || null,
        gift_card_code: cupomCode,
        metadata: bookingMetadata,
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
    expires_at: payment.date_of_expiration,
    amount_total_centavos: amountToChargeCents,
  });
});
