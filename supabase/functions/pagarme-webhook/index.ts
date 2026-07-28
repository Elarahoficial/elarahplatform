// =============================================================
// ELARAH — pagarme-webhook Edge Function
// -------------------------------------------------------------
// POST /functions/v1/pagarme-webhook
//
// Recebe as notificações do Pagar.me (API V5) e concilia a reserva:
// quando a order/charge é paga, marca a booking como 'pago' e dispara
// a confirmação (reaproveita a função resend-booking-confirmation).
//
// Segurança: Basic Auth. No painel do Pagar.me você cadastra a URL do
// webhook com usuário/senha; o Pagar.me envia esse Basic Auth em cada
// POST, e a gente valida contra PAGARME_WEBHOOK_USER/PASSWORD.
//
// Idempotente: se a booking já está 'pago', não reprocessa nem reenvia.
//
// config.toml deve declarar verify_jwt=false (o Pagar.me não manda JWT).
//
// Env:
//   PAGARME_WEBHOOK_USER / PAGARME_WEBHOOK_PASSWORD  (Basic Auth)
//   PAGARME_SECRET_KEY                               (consulta a order)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getOrder, verifyWebhookBasicAuth } from "../_shared/pagarme.ts";

const PAGARME_SECRET_KEY = Deno.env.get("PAGARME_SECRET_KEY") ?? "";
const WEBHOOK_USER = Deno.env.get("PAGARME_WEBHOOK_USER") ?? "";
const WEBHOOK_PASS = Deno.env.get("PAGARME_WEBHOOK_PASSWORD") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Dispara a confirmação da reserva reaproveitando a função existente.
// Best-effort: se falhar, apenas loga (a reserva já está 'pago').
async function triggerConfirmation(bookingId: string): Promise<void> {
  try {
    const url = SUPABASE_URL.replace(/\/+$/, "") +
      "/functions/v1/resend-booking-confirmation";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SERVICE_ROLE,
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });
    if (!res.ok) {
      console.warn(
        "[Elarah Payment/Pagarme webhook] confirmação retornou",
        res.status,
      );
    }
  } catch (e) {
    console.warn("[Elarah Payment/Pagarme webhook] confirmação falhou", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200 });
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  // ----- Valida Basic Auth -----
  const authHeader = req.headers.get("authorization");
  if (!verifyWebhookBasicAuth(authHeader, WEBHOOK_USER, WEBHOOK_PASS)) {
    console.warn("[Elarah Payment/Pagarme webhook] Basic Auth inválido");
    return new Response("unauthorized", { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = await req.json();
  } catch {
    return new Response("invalid_json", { status: 400 });
  }

  const type = String(event.type ?? "");
  const data = (event.data ?? {}) as Record<string, unknown>;

  console.info("[Elarah Payment/Pagarme webhook] evento", "type=" + type);

  // Só nos interessa pagamento confirmado.
  // order.paid → data é a order (tem .code = booking_id).
  // charge.paid → data é a charge (tem .order.code ou .code).
  const isPaid = type === "order.paid" ||
    type === "charge.paid" ||
    (type.startsWith("order.") && String(data.status ?? "") === "paid") ||
    (type.startsWith("charge.") && String(data.status ?? "") === "paid");

  if (!isPaid) {
    // Reconhece o evento mas não age (recusa, pendente, etc.).
    return new Response(
      JSON.stringify({ received: true, ignored: type }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Resolve o booking_id. Enviamos metadata.booking_id no Payment Link,
  // que propaga pra order criada — então priorizamos metadata. Fallbacks:
  // order.code e, por último, o pl_/or_ id salvo em booking.mp_payment_id.
  let bookingId = "";
  const orderObj = (data.order ?? data) as Record<string, unknown>;
  const meta = (orderObj?.metadata ?? data.metadata ?? {}) as Record<string, unknown>;
  if (typeof meta.booking_id === "string") bookingId = meta.booking_id;
  else if (typeof orderObj?.code === "string") bookingId = orderObj.code as string;

  // Fallback: acha pelo pagarme_order_id salvo no metadata/mp_payment_id.
  let bookingRow: { id: string; status: string } | null = null;
  if (bookingId) {
    const { data: b } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .maybeSingle();
    if (b) bookingRow = b as { id: string; status: string };
  }
  if (!bookingRow) {
    const orderId = String((data.order as Record<string, unknown>)?.id ?? data.id ?? "");
    if (orderId) {
      const { data: b } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("mp_payment_id", orderId)
        .maybeSingle();
      if (b) bookingRow = b as { id: string; status: string };
    }
  }

  if (!bookingRow) {
    console.warn("[Elarah Payment/Pagarme webhook] booking não encontrada", "code=" + bookingId);
    // 200 pra o Pagar.me não ficar reenviando eternamente.
    return new Response(
      JSON.stringify({ received: true, booking_not_found: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Idempotência: já pago → não reprocessa.
  if (bookingRow.status === "pago") {
    return new Response(
      JSON.stringify({ received: true, idempotent: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Marca como pago (só se ainda não estiver, pra evitar corrida).
  const { data: updated, error: updErr } = await supabase
    .from("bookings")
    .update({ status: "pago" })
    .eq("id", bookingRow.id)
    .neq("status", "pago")
    .select("id")
    .maybeSingle();

  if (updErr) {
    console.error("[Elarah Payment/Pagarme webhook] update pago falhou", updErr);
    return new Response("update_failed", { status: 500 });
  }

  if (updated) {
    console.info("[Elarah Payment/Pagarme webhook] booking paga", "booking=" + bookingRow.id);
    await triggerConfirmation(bookingRow.id);
  }

  return new Response(
    JSON.stringify({ received: true, paid: true }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
