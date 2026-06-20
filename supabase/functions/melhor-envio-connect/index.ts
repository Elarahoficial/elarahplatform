// =============================================================
// ELARAH — melhor-envio-connect Edge Function
// -------------------------------------------------------------
// POST /functions/v1/melhor-envio-connect
//
// Headers:
//   Authorization: Bearer <jwt do admin logado>
//
// Body JSON (opcional):
//   { "return_to": "https://elarah.com.br/admin.html" }
//
// Resposta:
//   200 { ok: true, url: "https://www.melhorenvio.com.br/oauth/authorize?..." }
//   401 { ok: false, error: "Não autorizado" }
//   400 { ok: false, error: "Integração não configurada" }
//
// Fluxo:
//   1. Confirma que quem chama é admin (mesmo helper da integração social).
//   2. Gera um `state` aleatório (CSRF) e guarda em melhor_envio_tokens.
//   3. Monta a URL OAuth do Melhor Envio com o redirect_uri da função
//      melhor-envio-callback (derivado do SUPABASE_URL).
//   4. Devolve a URL pro frontend, que faz window.location = url.
//
// Depois que o admin autoriza, o Melhor Envio redireciona pra
// melhor-envio-callback, que finaliza a conexão.
// =============================================================

// deploy: frete Melhor Envio (preço real Correios) — v2
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin } from "../_shared/social_db.ts";
import { generateOAuthState } from "../_shared/social_crypto.ts";
import {
  buildAuthorizeUrl,
  melhorEnvioConfigured,
  setPendingState,
} from "../_shared/melhor_envio.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface ConnectBody {
  return_to?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Método não permitido" }, 405);
  }

  try {
    const adminId = await authorizeAdmin(req.headers.get("authorization"));
    if (!adminId) {
      return jsonResponse({ ok: false, error: "Não autorizado" }, 401);
    }

    if (!melhorEnvioConfigured()) {
      return jsonResponse({
        ok: false,
        error:
          "Integração do Melhor Envio não configurada. Defina os secrets " +
          "MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET no Supabase.",
      }, 400);
    }

    let body: ConnectBody = {};
    try {
      body = await req.json();
    } catch {
      // body opcional — segue com return_to nulo.
    }
    const returnTo = body.return_to ? String(body.return_to) : null;

    const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/+$/, "");
    if (!supabaseUrl) {
      return jsonResponse({ ok: false, error: "SUPABASE_URL ausente." }, 500);
    }
    const redirectUri = `${supabaseUrl}/functions/v1/melhor-envio-callback`;

    const state = generateOAuthState();
    await setPendingState(state, returnTo);
    const url = buildAuthorizeUrl(redirectUri, state);

    return jsonResponse({ ok: true, url });
  } catch (err) {
    console.error("[melhor-envio-connect] erro:", err);
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});
