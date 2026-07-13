// =============================================================
// ELARAH — get-mp-public-key Edge Function
// -------------------------------------------------------------
// GET/POST /functions/v1/get-mp-public-key
//
// Devolve a PUBLIC KEY (chave publicável) do Mercado Pago pro
// frontend inicializar o MercadoPago.js V2 (Secure Fields + Device
// ID). A public key é publicável por design — pode ficar exposta no
// navegador, exatamente como a anon key do Supabase. NÃO é o access
// token (esse fica só no servidor).
//
// Por que um endpoint em vez de hardcodar no front?
//   - Mantém a chave configurável por ambiente (test/prod) via env,
//     sem precisar editar/re-deployar o site estático.
//   - Permite girar a chave sem tocar no código.
//   - O front usa a presença (ou não) da chave pra decidir se ativa o
//     Checkout Transparente (cartão inline) ou cai no Checkout Pro.
//
// Variáveis de ambiente (a primeira que existir vence):
//   MP_PUBLIC_KEY            (recomendado)
//   MP_CARD_PUBLIC_KEY       (alias, conta do cartão)
//   MERCADO_PAGO_PUBLIC_KEY  (alias longo)
//
// Resposta:
//   200 { public_key: "APP_USR-...", is_test: false }
//   200 { public_key: null }            (nenhuma configurada → front usa Checkout Pro)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MP_PUBLIC_KEY =
  Deno.env.get("MP_PUBLIC_KEY") ??
  Deno.env.get("MP_CARD_PUBLIC_KEY") ??
  Deno.env.get("MERCADO_PAGO_PUBLIC_KEY") ??
  "";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Cacheável no cliente por alguns minutos — a chave muda raramente.
      "Cache-Control": "public, max-age=300",
    },
  });
}

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  if (!MP_PUBLIC_KEY) {
    // Sem chave → o front sabe que deve usar o Checkout Pro (fallback).
    console.warn(
      "[Elarah Payment/MP] get-mp-public-key: nenhuma MP_PUBLIC_KEY configurada — " +
        "o cartão vai cair no Checkout Pro. Configure MP_PUBLIC_KEY pra ativar Secure Fields.",
    );
    return jsonResponse({ public_key: null });
  }

  const isTest = MP_PUBLIC_KEY.startsWith("TEST-");
  return jsonResponse({ public_key: MP_PUBLIC_KEY, is_test: isTest });
});
