// =============================================================
// ELARAH — get-pagarme-public-key Edge Function
// -------------------------------------------------------------
// GET/POST /functions/v1/get-pagarme-public-key
//
// Devolve a PUBLIC KEY (pk_...) do Pagar.me pro frontend tokenizar o
// cartão via POST https://api.pagar.me/core/v5/tokens?appId=pk_...
// A public key é publicável por design — pode ficar exposta no
// navegador (como a anon key do Supabase). A SECRET KEY (sk_...) NUNCA
// sai do servidor.
//
// Por que um endpoint em vez de hardcodar no front?
//   - Configurável por ambiente (teste/produção) via env, sem editar/
//     re-deployar o site estático.
//   - Permite girar a chave sem tocar no código.
//   - O front usa a presença da chave pra decidir se ativa o cartão
//     transparente (tokenização inline).
//
// Variável de ambiente:
//   PAGARME_PUBLIC_KEY   (pk_test_... ou pk_...)
//
// Resposta:
//   200 { public_key: "pk_...", is_test: false }
//   200 { public_key: null }   (não configurada → front oculta o cartão Pagar.me)
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PAGARME_PUBLIC_KEY = Deno.env.get("PAGARME_PUBLIC_KEY") ?? "";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
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
      "[Elarah Payment/Pagarme] get-pagarme-public-key: PAGARME_PUBLIC_KEY " +
        "não configurada — o cartão via Pagar.me fica indisponível no front.",
    );
    return jsonResponse({ public_key: null });
  }

  const isTest = PAGARME_PUBLIC_KEY.startsWith("pk_test_");
  return jsonResponse({ public_key: PAGARME_PUBLIC_KEY, is_test: isTest });
});
