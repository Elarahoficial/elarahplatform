// =============================================================
// ELARAH — oauth-callback Edge Function
// -------------------------------------------------------------
// GET /functions/v1/oauth-callback?code=...&state=...
//
// Endpoint chamado pelo Instagram após o admin autorizar o app.
// Não recebe JWT — é redirect do navegador. Autenticidade é
// garantida pelo `state` que foi criado no oauth-start (CSRF).
//
// Fluxo (Login direto pelo Instagram — apps tipo Empresa):
//   1. Valida state (consome a linha em social_oauth_states).
//   2. Troca `code` por short-lived USER access token via
//      POST https://api.instagram.com/oauth/access_token.
//   3. Troca short-lived → long-lived (60 dias) via
//      GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token.
//   4. GET /me?fields=user_id,username,name,account_type pra
//      pegar o handle e o id da conta.
//   5. Criptografa o long-lived token (Web Crypto AES-GCM).
//   6. Upsert em social_accounts com provider=instagram.
//   7. Redireciona o navegador pra return_to com ?social_connected=1.
//
// Diferenças do fluxo via Facebook Login (legado):
//   - Não busca Página do FB.
//   - Não há instagram_business_account separado — o user_id já É
//     o id da conta business.
//   - Token armazenado é o IG long-lived (60 dias), refreshable.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  IG_GRAPH_BASE,
  IG_GRAPH_BASE_NOVERSION,
  IG_INSTAGRAM_SCOPES,
  IG_TOKEN_EXCHANGE_URL,
  requireEnv,
} from "../_shared/social_config.ts";
import { encryptToken } from "../_shared/social_crypto.ts";
import {
  consumeOAuthState,
  upsertSocialAccount,
  type OAuthStateRow,
} from "../_shared/social_db.ts";

// -----------------------------------------------------------
// Tipos da Instagram API
// -----------------------------------------------------------
interface ShortTokenResponse {
  access_token: string;
  user_id: number | string;
  permissions?: string[];
}

interface LongTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

interface IgMeResponse {
  user_id?: string;
  id?: string;
  username?: string;
  name?: string;
  account_type?: string;
}

interface IgErrorBody {
  error_type?: string;
  error_message?: string;
  error?: { message?: string; type?: string; code?: number };
  message?: string;
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
async function readError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as IgErrorBody;
    return j.error?.message || j.error_message || j.message || text;
  } catch {
    return text;
  }
}

function buildReturnUrl(state: OAuthStateRow | null, params: Record<string, string>): string {
  const fallback = Deno.env.get("ADMIN_FALLBACK_RETURN_URL")
    || "https://elarah.com.br/admin.html";
  const base = state?.return_to || fallback;
  try {
    const url = new URL(base);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  } catch {
    return fallback;
  }
}

function redirect(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: url,
      "Cache-Control": "no-store",
    },
  });
}

// -----------------------------------------------------------
// Handler principal
// -----------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  if (errorParam) {
    const stateRow = stateParam ? await consumeOAuthState(stateParam) : null;
    return redirect(buildReturnUrl(stateRow, {
      social_connected: "0",
      social_error: errorDesc || errorParam,
    }));
  }

  if (!code || !stateParam) {
    return redirect(buildReturnUrl(null, {
      social_connected: "0",
      social_error: "Resposta inválida do Instagram (sem code/state).",
    }));
  }

  const stateRow = await consumeOAuthState(stateParam);
  if (!stateRow) {
    return redirect(buildReturnUrl(null, {
      social_connected: "0",
      social_error: "Sessão de conexão expirou. Tente conectar novamente.",
    }));
  }
  if (stateRow.provider !== "instagram") {
    return redirect(buildReturnUrl(stateRow, {
      social_connected: "0",
      social_error: "Provider não suportado.",
    }));
  }

  try {
    const appId = requireEnv("INSTAGRAM_APP_ID");
    const appSecret = requireEnv("INSTAGRAM_APP_SECRET");
    const redirectUri = stateRow.redirect_uri;

    // 1) Troca code por short-lived token (POST x-www-form-urlencoded)
    const shortBody = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });
    const shortRes = await fetch(IG_TOKEN_EXCHANGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: shortBody.toString(),
    });
    if (!shortRes.ok) {
      throw new Error(`Troca de code → token falhou: ${await readError(shortRes)}`);
    }
    const shortToken = await shortRes.json() as ShortTokenResponse;
    if (!shortToken.access_token || !shortToken.user_id) {
      throw new Error("Resposta sem access_token/user_id");
    }
    const igUserId = String(shortToken.user_id);

    // 2) Troca short-lived → long-lived (60 dias)
    const longUrl = new URL(`${IG_GRAPH_BASE_NOVERSION}/access_token`);
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("access_token", shortToken.access_token);
    const longRes = await fetch(longUrl.toString());
    if (!longRes.ok) {
      throw new Error(`Troca short→long falhou: ${await readError(longRes)}`);
    }
    const longToken = await longRes.json() as LongTokenResponse;
    if (!longToken.access_token) {
      throw new Error("Long-lived sem access_token");
    }
    const expiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
      : null;

    // 3) Pega info do usuário
    const meUrl = new URL(`${IG_GRAPH_BASE}/me`);
    meUrl.searchParams.set("fields", "user_id,username,name,account_type");
    meUrl.searchParams.set("access_token", longToken.access_token);
    const meRes = await fetch(meUrl.toString());
    if (!meRes.ok) {
      throw new Error(`GET /me falhou: ${await readError(meRes)}`);
    }
    const me = await meRes.json() as IgMeResponse;
    const username = me.username || null;
    const displayName = me.name || username;
    const accountType = me.account_type || null;

    // 4) Criptografa o long-lived token
    const accessTokenEnc = await encryptToken(longToken.access_token);

    // 5) Upsert em social_accounts
    await upsertSocialAccount({
      provider: "instagram",
      externalId: igUserId,
      username,
      displayName,
      accessTokenEncrypted: accessTokenEnc,
      refreshTokenEncrypted: null,
      tokenExpiresAt: expiresAt,
      scopes: [...IG_INSTAGRAM_SCOPES],
      meta: {
        login_method: "instagram_direct",
        account_type: accountType,
        connected_by: stateRow.admin_user_id,
        connected_at: new Date().toISOString(),
        api_version: IG_GRAPH_BASE.split("/").pop(),
      },
    });

    // 6) Sucesso → volta pro admin
    return redirect(buildReturnUrl(stateRow, {
      social_connected: "1",
      social_provider: "instagram",
      social_username: username || "",
    }));
  } catch (err) {
    console.error("[oauth-callback] erro:", err);
    return redirect(buildReturnUrl(stateRow, {
      social_connected: "0",
      social_error: err instanceof Error ? err.message : String(err),
    }));
  }
});
