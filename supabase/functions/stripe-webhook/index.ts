// =============================================================
// ELARAH — stripe-webhook Edge Function
// -------------------------------------------------------------
// POST /functions/v1/stripe-webhook
//
// Recebe eventos da Stripe (configurar URL no Stripe Dashboard
// → Developers → Webhooks → "Add endpoint"). Eventos relevantes:
//   * checkout.session.completed     → marca booking como "pago"
//   * checkout.session.expired       → marca como "expirado"
//   * checkout.session.async_payment_failed → marca como "cancelado"
//   * charge.refunded                → marca como "reembolsado"
//
// Variáveis de ambiente esperadas (configure no Supabase):
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   whsec_...
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Importante: esta função deve ser publicada com
//   --no-verify-jwt   (Stripe não envia o JWT do Supabase)
// Comando de deploy:
//   supabase functions deploy stripe-webhook --no-verify-jwt
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function updateBookingBySession(
  sessionId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("stripe_session_id", sessionId);
  if (error) {
    console.error("[stripe-webhook] booking update error", sessionId, error);
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SERVICE_ROLE) {
    console.error("[stripe-webhook] missing env vars");
    return new Response("server_misconfigured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("missing_signature", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    console.error("[stripe-webhook] signature verification failed", e);
    return new Response("invalid_signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.id) break;
        await updateBookingBySession(session.id, {
          status: "pago",
          stripe_payment_intent: session.payment_intent ?? null,
          amount_total: session.amount_total ?? null,
          currency: session.currency ?? "brl",
        });
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.id) break;
        await updateBookingBySession(session.id, { status: "expirado" });
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.id) break;
        await updateBookingBySession(session.id, { status: "cancelado" });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!pi) break;
        const { error } = await supabase
          .from("bookings")
          .update({ status: "reembolsado" })
          .eq("stripe_payment_intent", pi);
        if (error) console.error("[stripe-webhook] refund update error", error);
        break;
      }
      default:
        // Ignora silenciosamente eventos não usados.
        break;
    }
  } catch (e) {
    console.error("[stripe-webhook] handler exception", e);
    return new Response("handler_error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
