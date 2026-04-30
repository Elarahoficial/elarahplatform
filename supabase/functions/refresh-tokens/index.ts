// =============================================================
// ELARAH — refresh-tokens Edge Function
// -------------------------------------------------------------
// POST /functions/v1/refresh-tokens
//   Body (opcional): { account_id?: "uuid" }
//
// Headers:
//   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>   (cron)
//   Authorization: Bearer <jwt do admin>                (manual)
//
// O que faz:
//   - Lê todas as accounts com token expirando em ≤14 dias.
//   - Pra cada uma:
//       * Decripta o user long-lived token.
//       * Chama Graph API: GET /oauth/access_token?grant_type=fb_exchange_token
//         (Meta aceita renovar long-lived com long-lived — gera outro 60 dias).
//       * Re-criptografa e atualiza social_accounts.
//   - Page Access Tokens herdam o prazo do user token, então
//     também renovamos eles via /me/accounts.
//
// Decisões:
//   - Janela de 14 dias evita "renovar e ainda quebrar" se o cron
//     falhar uma noite. Renova bem antes de expirar.
//   - Roda 1x por mês via pg_cron — nas semanas que não roda,
//     ninguém fica sem token porque a janela de 14 dias é folgada.
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { authorizeAdmin, getServiceClient } from "../_shared/social_db.ts";
import { decryptToken, encryptToken } from "../_shared/social_crypto.ts";
import { MetaGraphClient } from "../_shared/social_meta_client.ts";
import { META_GRAPH_BASE, requireEnv } from "../_shared/social_config.ts";

interface TokenExchangeResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

interface MeAccountsResponse {
  data: Array<{ id: string; access_token: string }>;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authorizeRequest(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return false;
  const token = m[1];
  if (token === requireEnv("SUPABASE_SERVICE_ROLE_KEY")) return true;
  const adminId = await authorizeAdmin(auth);
  return !!adminId;
}

interface RefreshResult {
  account_id: string;
  username: string | null;
  ok: boolean;
  expires_at: string | null;
  error: string | null;
}

async function refreshOneAccount(account: {
  id: string;
  username: string | null;
  external_id: string;
  access_token_encrypted: string;
  meta: Record<string, unknown>;
}): Promise<RefreshResult> {
  const sb = getServiceClient();
  try {
    const userToken = await decryptToken(account.access_token_encrypted);

    // Renova user long-lived
    const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`);
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", requireEnv("META_APP_ID"));
    url.searchParams.set("client_secret", requireEnv("META_APP_SECRET"));
    url.searchParams.set("fb_exchange_token", userToken);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Renovação falhou ${res.status}: ${text.slice(0, 200)}`);
    }
    const newTokenResp = (await res.json()) as TokenExchangeResponse;
    const newUserToken = newTokenResp.access_token;
    const expiresAt = newTokenResp.expires_in
      ? new Date(Date.now() + newTokenResp.expires_in * 1000).toISOString()
      : null;

    // Pega o page access token novo (deriva do user renovado)
    const userClient = new MetaGraphClient(await encryptToken(newUserToken));
    const pages = await userClient.get<MeAccountsResponse>("/me/accounts", {
      fields: "id,access_token",
    });
    const pageId = (account.meta as Record<string, unknown>)?.page_id;
    const matchingPage = pages.data?.find((p) => p.id === pageId);
    if (!matchingPage) {
      throw new Error("Page conectada não foi mais encontrada após refresh.");
    }

    const newPageTokenEnc = await encryptToken(matchingPage.access_token);
    const newUserTokenEnc = await encryptToken(newUserToken);

    const updatedMeta = {
      ...(account.meta || {}),
      page_access_token_enc: newPageTokenEnc,
      last_token_refresh_at: new Date().toISOString(),
    };

    await sb.from("social_accounts").update({
      access_token_encrypted: newUserTokenEnc,
      token_expires_at: expiresAt,
      meta: updatedMeta,
      status: "active",
      last_sync_error: null,
    }).eq("id", account.id);

    return {
      account_id: account.id,
      username: account.username,
      ok: true,
      expires_at: expiresAt,
      error: null,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await sb.from("social_accounts").update({
      status: "error",
      last_sync_error: `Refresh falhou: ${errMsg}`,
    }).eq("id", account.id);
    return {
      account_id: account.id,
      username: account.username,
      ok: false,
      expires_at: null,
      error: errMsg,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Método não permitido" }, 405);

  try {
    const ok = await authorizeRequest(req);
    if (!ok) return jsonResponse({ ok: false, error: "Não autorizado" }, 401);

    let body: { account_id?: string } = {};
    try { body = await req.json(); } catch { /* body opcional */ }

    const sb = getServiceClient();
    // Janela de 14 dias antes da expiração
    const cutoff = new Date(Date.now() + 14 * 86400000).toISOString();

    const query = sb
      .from("social_accounts")
      .select("id, username, external_id, access_token_encrypted, meta, token_expires_at")
      .eq("provider", "instagram");
    if (body.account_id) {
      query.eq("id", body.account_id);
    } else {
      query.lt("token_expires_at", cutoff);
    }

    const { data: accounts, error } = await query;
    if (error) throw new Error(error.message);
    if (!accounts || accounts.length === 0) {
      return jsonResponse({ ok: true, message: "Nenhum token precisando renovar.", results: [] });
    }

    const results: RefreshResult[] = [];
    for (const acc of accounts) {
      results.push(await refreshOneAccount(acc as never));
    }
    return jsonResponse({ ok: true, results });
  } catch (err) {
    console.error("[refresh-tokens] erro:", err);
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});
