// =============================================================
// ELARAH — get-pagarme-public-key Edge Function
// -------------------------------------------------------------
// GET/POST /functions/v1/get-pagarme-public-key
//
// Devolve a CHAVE PÚBLICA do Pagar.me (pk_test_… / pk_live_…) pro
// front tokenizar o cartão direto no Pagar.me (POST /tokens?appId=pk).
// A chave pública é publicável por design — pode ficar exposta no
// navegador, igual à anon key do Supabase. NÃO é a secret key (essa
// fica só no servidor, em PAGARME_SECRET_KEY).
//
// Assim o cartão do cliente vai do navegador DIRETO pro Pagar.me e
// nunca passa pelo nosso servidor (PCI SAQ A-EP).
//
// Env (a primeira que existir vence):
//   PAGARME_PUBLIC_KEY   (recomendado)
//   PAGARME_PK           (alias curto)
//
// Resposta:
//   200 { public_key: "pk_test_...", is_test: true }
//   200 { public_key: null }   (nenhuma configurada → front usa hospedado)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PAGARME_PUBLIC_KEY =
  Deno.env.get("PAGARME_PUBLIC_KEY") ??
  Deno.env.get("PAGARME_PK") ??
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

  if (!PAGARME_PUBLIC_KEY) {
    console.warn(
      "[Elarah Payment/Pagarme] get-pagarme-public-key: nenhuma PAGARME_PUBLIC_KEY " +
        "configurada — o cartão transparente fica indisponível. Configure a chave " +
        "pública (pk_test_…/pk_live_…) do painel Pagar.me.",
    );
    return jsonResponse({ public_key: null });
  }

  const isTest = PAGARME_PUBLIC_KEY.startsWith("pk_test_");
  return jsonResponse({ public_key: PAGARME_PUBLIC_KEY, is_test: isTest });
});
