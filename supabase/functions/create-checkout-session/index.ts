// =============================================================
// ELARAH — create-checkout-session Edge Function
// -------------------------------------------------------------
// POST /functions/v1/create-checkout-session
//
// Body JSON:
//   {
//     "experiencia_id": "uuid",
//     "horario": "19h00 – 22h30",   // opcional
//     "email":   "cliente@dominio"  // opcional (se logado)
//   }
//
// Resposta:
//   { url: "https://checkout.stripe.com/...", session_id: "cs_..." }
//
// Comportamento:
//   * Busca a experiência no banco para garantir preço autoritativo
//     (não confia no preço enviado pelo frontend).
//   * Cria a Stripe Checkout Session com metadata da reserva.
//   * Insere uma row em public.bookings com status='pending'
//     usando o SUPABASE_SERVICE_ROLE_KEY (ignora RLS).
//   * Retorna a URL para o frontend redirecionar.
//
// Variáveis de ambiente esperadas (configure no Supabase):
//   STRIPE_SECRET_KEY        sk_test_... ou sk_live_...
//   SUPABASE_URL             (preenchida automaticamente)
//   SUPABASE_SERVICE_ROLE_KEY
//   PUBLIC_SITE_URL          ex.: https://elarah.com.br
//                            (sem barra final)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PUBLIC_SITE_URL =
  (Deno.env.get("PUBLIC_SITE_URL") ?? "").replace(/\/+$/, "") ||
  "https://elarah.com.br";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// "R$ 1.234,50" / "R$383" / "383,00" -> 38300 (centavos)
function parsePrecoToCents(raw: unknown): number | null {
  if (raw == null) return null;
  const text = String(raw).replace(/\s/g, "").replace(/^R\$/i, "");
  if (!text) return null;
  // Formato BR: usa vírgula como decimal e ponto como milhar.
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const num = Number(normalized);
  if (!isFinite(num) || num <= 0) return null;
  return Math.round(num * 100);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[create-checkout-session] missing env vars");
    return jsonResponse({ error: "server_misconfigured" }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const experienciaId = String(payload.experiencia_id ?? "").trim();
  const horario = payload.horario ? String(payload.horario).trim() : null;
  const email = payload.email ? String(payload.email).trim() : null;
  const nome = payload.nome ? String(payload.nome).trim() : null;

  if (!experienciaId) {
    return jsonResponse({ error: "experiencia_id_required" }, 400);
  }

  // Busca a experiência (preço autoritativo).
  const { data: exp, error: expErr } = await supabase
    .from("experiences")
    .select("id, nome, preco, data, horario, horarios, endereco, bairro")
    .eq("id", experienciaId)
    .maybeSingle();

  if (expErr) {
    console.error("[create-checkout-session] experience lookup error", expErr);
    return jsonResponse({ error: "experience_lookup_failed" }, 500);
  }
  if (!exp) {
    return jsonResponse({ error: "experience_not_found" }, 404);
  }

  const cents = parsePrecoToCents(exp.preco);
  if (!cents) {
    console.error("[create-checkout-session] invalid price", exp.preco);
    return jsonResponse({ error: "invalid_price" }, 422);
  }

  // Resolve user_id pelo email (opcional).
  let userId: string | null = null;
  if (email) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (prof) userId = prof.id;
  }

  const successUrl =
    PUBLIC_SITE_URL + "/success.html?session_id={CHECKOUT_SESSION_ID}";
  const cancelUrl = PUBLIC_SITE_URL + "/cancel.html";

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      locale: "pt-BR",
      customer_email: email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: cents,
            product_data: {
              name: exp.nome,
              description: [exp.data, horario, exp.bairro]
                .filter(Boolean)
                .join(" · ")
                .slice(0, 380),
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        experiencia_id: exp.id,
        experiencia_nome: exp.nome,
        data: exp.data ?? "",
        horario: horario ?? "",
        email: email ?? "",
        nome: nome ?? "",
      },
    });
  } catch (e) {
    console.error("[create-checkout-session] stripe create error", e);
    return jsonResponse({ error: "stripe_create_failed" }, 502);
  }

  // Insere booking pending — fonte da verdade local.
  const { error: insertErr } = await supabase.from("bookings").insert({
    user_id: userId,
    email: email ?? "",
    nome: nome,
    experiencia_id: exp.id,
    experiencia_nome: exp.nome,
    data: exp.data ?? null,
    horario: horario,
    preco_label: exp.preco,
    amount_total: cents,
    currency: "brl",
    status: "pending",
    stripe_session_id: session.id,
    metadata: {
      bairro: exp.bairro ?? null,
      endereco: exp.endereco ?? null,
    },
  });

  if (insertErr) {
    // Não impede o checkout, mas loga forte para investigarmos.
    console.error("[create-checkout-session] booking insert error", insertErr);
  }

  return jsonResponse({ url: session.url, session_id: session.id });
});
