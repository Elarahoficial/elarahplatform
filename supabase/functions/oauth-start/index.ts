// =============================================================
// ELARAH — oauth-start Edge Function
// -------------------------------------------------------------
// POST /functions/v1/oauth-start
//
// Body JSON:
//   { "provider": "instagram", "return_to": "https://elarah.com.br/admin.html" }
//
// Headers:
//   Authorization: Bearer <jwt do admin logado>
//
// Resposta:
//   200 { ok: true, url: "https://www.facebook.com/...?state=..." }
//   401 { ok: false, error: "Não autorizado" }
//   400 { ok: false, error: "Provider inválido" }
//   500 { ok: false, error: "..." }
//
// Fluxo:
//   1. Valida que quem chama é admin (JWT no header).
//   2. Gera um `state` aleatório e salva em social_oauth_states
//      (CSRF protection — só esse state vai ser aceito no callback).
//   3. Monta a URL OAuth da Meta com client_id, redirect_uri,
//      scope, state, response_type=code.
//   4. Devolve a URL pro frontend, que faz window.location = url.
//
// Por que devolver URL em JSON em vez de redirect HTTP direto:
//   - Permite o frontend mandar Authorization header (não dá pra
//     setar header em window.location).
//   - Permite tratar erro (ex: usuário não-admin) na UI.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  META_INSTAGRAM_SCOPES,
  META_OAUTH_DIALOG_URL,
  requireEnv,
  SUPPORTED_PROVIDERS,
  type SocialProvider,
} from "../_shared/social_config.ts";
import { authorizeAdmin, createOAuthState } from "../_shared/social_db.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface StartBody {
  provider?: string;
  return_to?: string | null;
}

function scopesFor(provider: SocialProvider): readonly string[] {
  switch (provider) {
    case "instagram":
      return META_INSTAGRAM_SCOPES;
    // tiktok / linkedin: adicionar quando suas Edge Functions vierem.
    default:
      return [];
  }
}

function authUrlFor(
  provider: SocialProvider,
  state: string,
  redirectUri: string,
): string {
  if (provider === "instagram") {
    const params = new URLSearchParams({
      client_id: requireEnv("META_APP_ID"),
      redirect_uri: redirectUri,
      state,
      scope: scopesFor(provider).join(","),
      response_type: "code",
    });
    return `${META_OAUTH_DIALOG_URL}?${params.toString()}`;
  }
  throw new Error(`Provider não suportado ainda: ${provider}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Método não permitido" }, 405);
  }

  try {
    // 1) Autoriza admin
    const adminId = await authorizeAdmin(req.headers.get("authorization"));
    if (!adminId) {
      return jsonResponse({ ok: false, error: "Não autorizado" }, 401);
    }

    // 2) Lê e valida body
    let body: StartBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ ok: false, error: "JSON inválido" }, 400);
    }

    const provider = String(body.provider || "").toLowerCase() as SocialProvider;
    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return jsonResponse(
        { ok: false, error: `Provider inválido. Suportados: ${SUPPORTED_PROVIDERS.join(", ")}` },
        400,
      );
    }

    const returnTo = body.return_to ? String(body.return_to) : null;

    // 3) Calcula o redirect_uri da própria Edge Function
    //    oauth-callback. É derivado do SUPABASE_URL pra não ter
    //    que configurar manualmente.
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const redirectUri = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/oauth-callback`;

    // 4) Cria o state e monta URL final
    const state = await createOAuthState({
      provider,
      adminUserId: adminId,
      redirectUri,
      returnTo,
    });
    const url = authUrlFor(provider, state, redirectUri);

    return jsonResponse({ ok: true, url });
  } catch (err) {
    console.error("[oauth-start] erro:", err);
    return jsonResponse(
      { ok: false, error: (err instanceof Error ? err.message : String(err)) },
      500,
    );
  }
});
