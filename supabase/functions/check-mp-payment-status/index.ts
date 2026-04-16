// =============================================================
// ELARAH — check-mp-payment-status Edge Function
// -------------------------------------------------------------
// POST /functions/v1/check-mp-payment-status
//
// Backup do webhook da MP. Consulta o status real de um pagamento
// direto na API do Mercado Pago e reconcilia a booking local se
// necessário.
//
// Usado quando:
//   - Webhook atrasou ou falhou e o cliente clicou "Já paguei,
//     verificar" no frontend
//   - Admin quer forçar reconciliação de uma booking pending
//
// Payload:
//   { "booking_id": "uuid" }
//     OU
//   { "payment_id": "1234567890" }
//
// Resposta:
//   {
//     booking_id, mp_payment_id, mp_status, booking_status,
//     updated: true|false
//   }
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { getPayment } from "../_shared/mercadopago.ts";
import {
  bookingConfirmationEmailHtml,
  sendEmail,
} from "../_shared/email.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
type Booking = any;

async function findBooking(
  bookingId: string | null,
  paymentId: string | null,
): Promise<Booking | null> {
  if (bookingId) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (data) return data;
  }
  if (paymentId) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("mp_payment_id", paymentId)
      .maybeSingle();
    if (data) return data;
    // Fallback: placeholder em stripe_session_id
    const { data: byPlaceholder } = await supabase
      .from("bookings")
      .select("*")
      .eq("stripe_session_id", "MP-" + paymentId)
      .maybeSingle();
    if (byPlaceholder) return byPlaceholder;
  }
  return null;
}

async function sendConfirmationEmail(booking: Booking) {
  if (!booking.email) return;
  const meta = (booking.metadata ?? {}) as Record<string, unknown>;
  const html = bookingConfirmationEmailHtml({
    nome: booking.nome,
    experienciaNome: booking.experiencia_nome ?? "Sua experiência",
    data: booking.data,
    horario: booking.horario,
    endereco: (meta.endereco as string | null) ?? null,
    precoLabel: booking.preco_label,
  });
  const result = await sendEmail({
    to: booking.email,
    subject: "Sua reserva na Elarah está confirmada ✨",
    html,
  });
  if (!result.ok) {
    console.error(
      "[Elarah Payment/MP] reconcile: e-mail falhou",
      "booking_id=" + booking.id,
      "error=" + (result.error ?? "?"),
    );
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }
  if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SERVICE_ROLE) {
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const bookingId = payload.booking_id ? String(payload.booking_id) : null;
  const paymentIdFromPayload = payload.payment_id
    ? String(payload.payment_id)
    : null;

  if (!bookingId && !paymentIdFromPayload) {
    return jsonResponse(
      { error: "booking_id_or_payment_id_required" },
      400,
    );
  }

  const booking = await findBooking(bookingId, paymentIdFromPayload);
  if (!booking) {
    return jsonResponse({ error: "booking_not_found" }, 404);
  }

  const mpPaymentId = booking.mp_payment_id ||
    (booking.stripe_session_id?.startsWith("MP-")
      ? booking.stripe_session_id.slice(3)
      : null) ||
    paymentIdFromPayload;

  if (!mpPaymentId) {
    return jsonResponse(
      {
        booking_id: booking.id,
        mp_payment_id: null,
        mp_status: null,
        booking_status: booking.status,
        updated: false,
        message: "Booking não tem mp_payment_id — não é via Mercado Pago.",
      },
      200,
    );
  }

  console.info(
    "[Elarah Payment/MP] reconcile request",
    "booking=" + booking.id,
    "mp_payment=" + mpPaymentId,
  );

  const result = await getPayment(MP_ACCESS_TOKEN, mpPaymentId);
  if (!result.ok || !result.payment) {
    return jsonResponse(
      {
        error: "mp_fetch_failed",
        mp_status: null,
        detail: result.errorBody,
      },
      502,
    );
  }

  const payment = result.payment;
  const mpStatus = payment.status;
  let updated = false;

  // Só atualiza se o estado local estiver "atrás" do que a MP diz.
  if (booking.status !== "pago" &&
      (mpStatus === "approved" || mpStatus === "authorized")) {
    const paidCents = Math.round((payment.transaction_amount || 0) * 100);
    const { error: updErr } = await supabase
      .from("bookings")
      .update({
        status: "pago",
        amount_total: paidCents,
        currency: "brl",
      })
      .eq("id", booking.id);
    if (!updErr) {
      updated = true;
      console.info(
        "[Elarah Payment/MP] reconcile: booking marcada como pago",
        "booking=" + booking.id,
      );
      // Envia confirmação — o webhook pode não ter rodado.
      booking.status = "pago";
      booking.amount_total = paidCents;
      await sendConfirmationEmail(booking);
    } else {
      console.error(
        "[Elarah Payment/MP] reconcile: update falhou",
        updErr,
      );
    }
  } else if (
    booking.status !== "cancelado" &&
    booking.status !== "reembolsado" &&
    (mpStatus === "rejected" || mpStatus === "cancelled")
  ) {
    const { error: updErr } = await supabase
      .from("bookings")
      .update({ status: "cancelado" })
      .eq("id", booking.id);
    if (!updErr) {
      updated = true;
      // Devolve vaga + cupom — prioriza slot, fallback pra experiência
      // deno-lint-ignore no-explicit-any
      const bk = booking as any;
      const qty = Number(bk.quantidade) || 1;
      if (bk.slot_id) {
        await supabase.rpc("increment_slot_vagas", { p_slot_id: bk.slot_id, p_qty: qty });
      } else if (booking.experiencia_id) {
        await supabase.rpc("increment_experience_vagas", {
          p_experience_id: booking.experiencia_id, p_qty: qty,
        });
      }
      if (booking.gift_card_id && booking.gift_card_centavos) {
        await supabase.rpc("refund_gift_card", {
          p_gift_card_id: booking.gift_card_id,
          p_amount_centavos: booking.gift_card_centavos,
        });
      }
    }
  }

  return jsonResponse({
    booking_id: booking.id,
    mp_payment_id: String(mpPaymentId),
    mp_status: mpStatus,
    booking_status: updated ? (mpStatus === "approved" ? "pago" : "cancelado") : booking.status,
    updated,
  });
});
