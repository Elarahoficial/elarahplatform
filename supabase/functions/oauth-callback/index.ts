// =============================================================
// ELARAH — oauth-callback Edge Function
// -------------------------------------------------------------
// GET /functions/v1/oauth-callback?code=...&state=...
//
// Endpoint chamado pela Meta após o admin autorizar o app.
// Não recebe JWT — é redirect do navegador. Autenticidade é
// garantida pelo `state` que foi criado no oauth-start (CSRF).
//
// Fluxo (Instagram via Facebook Login for Business):
//   1. Valida state (consome a linha em social_oauth_states).
//   2. Troca `code` por short-lived USER access token.
//   3. Troca short-lived → long-lived (60 dias).
//   4. GET /me/accounts → lista as Pages do user.
//   5. Pra cada Page, GET ?fields=instagram_business_account.
//   6. Pega a primeira Page que tem IG Business conectado.
//   7. GET /{ig_user_id}?fields=username,name pra pegar o handle.
//   8. Criptografa o long-lived USER token (via Web Crypto AES-GCM).
//   9. Upsert em social_accounts com provider=instagram +
//      meta = { page_id, page_access_token_enc, ig_user_id }.
//  10. Redireciona o navegador pra return_to com ?social_connected=instagram.
//
// Notas:
//   - Token armazenado é o USER long-lived (60 dias). Page Access
//     Tokens são derivados sob demanda no sync — eles herdam o
//     prazo do user token.
//   - Se algo dá errado, redireciona com ?social_error=<motivo>
//     e marca a conta como status='error' (se a conta já existir).
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  META_GRAPH_BASE,
  META_INSTAGRAM_SCOPES,
  requireEnv,
} from "../_shared/social_config.ts";
import { encryptToken } from "../_shared/social_crypto.ts";
import {
  consumeOAuthState,
  upsertSocialAccount,
  type OAuthStateRow,
} from "../_shared/social_db.ts";

// -----------------------------------------------------------
// Helpers de fetch à Graph API com tratamento de erro uniforme.
// -----------------------------------------------------------
interface GraphErrorBody {
  error?: { message?: string; type?: string; code?: number };
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${META_GRAPH_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text) as GraphErrorBody;
      msg = j.error?.message || text;
    } catch { /* keep raw */ }
    throw new Error(`Graph ${path} ${res.status}: ${msg}`);
  }
  return JSON.parse(text) as T;
}

// -----------------------------------------------------------
// Redirect helpers
// -----------------------------------------------------------
function buildReturnUrl(state: OAuthStateRow | null, params: Record<string, string>): string {
  // Fallback: se return_to vier vazio (ou state inválido), volta
  // pra um URL configurado em env. Última camada de proteção.
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
// Tipos da Graph API
// -----------------------------------------------------------
interface TokenExchangeResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

interface MeAccountsResponse {
  data: Array<{
    id: string;
    name: string;
    access_token: string;
    category?: string;
  }>;
}

interface PageInstagramResponse {
  instagram_business_account?: { id: string };
  id: string;
}

interface IgUserResponse {
  id: string;
  username: string;
  name?: string;
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

  // O usuário pode ter clicado "Cancelar" na tela do Facebook.
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
      social_error: "Resposta inválida da Meta (sem code/state).",
    }));
  }

  // 1) Valida e consome o state (one-shot)
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
    const appId = requireEnv("META_APP_ID");
    const appSecret = requireEnv("META_APP_SECRET");
    const redirectUri = stateRow.redirect_uri;

    // 2) Troca code por short-lived user token (válido ~1h).
    const shortToken = await graphGet<TokenExchangeResponse>("/oauth/access_token", {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    // 3) Troca short-lived → long-lived (válido ~60 dias).
    const longToken = await graphGet<TokenExchangeResponse>("/oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken.access_token,
    });

    const expiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
      : null;

    // 4) Lista as Pages do user
    const pages = await graphGet<MeAccountsResponse>("/me/accounts", {
      access_token: longToken.access_token,
      fields: "id,name,access_token,category",
    });

    if (!pages.data || pages.data.length === 0) {
      throw new Error(
        "Nenhuma Página do Facebook encontrada nessa conta. Confirme que o " +
        "Instagram está vinculado a uma Página do FB que você administra.",
      );
    }

    // 5+6) Procura a Page que tem Instagram Business conectado
    let igUserId: string | null = null;
    let pageId: string | null = null;
    let pageName: string | null = null;
    let pageAccessToken: string | null = null;

    for (const page of pages.data) {
      const pageInfo = await graphGet<PageInstagramResponse>(`/${page.id}`, {
        access_token: page.access_token,
        fields: "instagram_business_account",
      });
      if (pageInfo.instagram_business_account?.id) {
        igUserId = pageInfo.instagram_business_account.id;
        pageId = page.id;
        pageName = page.name;
        pageAccessToken = page.access_token;
        break;
      }
    }

    if (!igUserId || !pageAccessToken) {
      throw new Error(
        "Nenhuma Página tem Instagram Business conectado. Vincule o Instagram " +
        "à Página antes de tentar conectar de novo.",
      );
    }

    // 7) Pega o handle do Instagram pra exibição amigável
    const igUser = await graphGet<IgUserResponse>(`/${igUserId}`, {
      access_token: pageAccessToken,
      fields: "username,name",
    });

    // 8) Criptografa o user long-lived token e o page token
    const accessTokenEnc = await encryptToken(longToken.access_token);
    const pageTokenEnc = await encryptToken(pageAccessToken);

    // 9) Upsert em social_accounts
    await upsertSocialAccount({
      provider: "instagram",
      externalId: igUserId,
      username: igUser.username || null,
      displayName: igUser.name || pageName,
      accessTokenEncrypted: accessTokenEnc,
      refreshTokenEncrypted: null,
      tokenExpiresAt: expiresAt,
      scopes: [...META_INSTAGRAM_SCOPES],
      meta: {
        page_id: pageId,
        page_name: pageName,
        page_access_token_enc: pageTokenEnc,
        connected_by: stateRow.admin_user_id,
        connected_at: new Date().toISOString(),
        api_version: META_GRAPH_BASE.split("/").pop(),
      },
    });

    // 10) Sucesso → volta pro admin
    return redirect(buildReturnUrl(stateRow, {
      social_connected: "1",
      social_provider: "instagram",
      social_username: igUser.username || "",
    }));
  } catch (err) {
    console.error("[oauth-callback] erro:", err);
    return redirect(buildReturnUrl(stateRow, {
      social_connected: "0",
      social_error: err instanceof Error ? err.message : String(err),
    }));
  }
});
