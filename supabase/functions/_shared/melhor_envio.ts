// =============================================================
// ELARAH — Melhor Envio (OAuth + token) compartilhado
// -------------------------------------------------------------
// Encapsula a integração OAuth2 com o Melhor Envio pra calcular
// frete real dos Correios (PAC/SEDEX). Tudo gira em torno da tabela
// public.melhor_envio_tokens (linha única id=1), com os tokens
// CRIPTOGRAFADOS (AES-GCM — reaproveita social_crypto.ts).
//
// Ciclo de vida do token:
//   1. melhor-envio-connect → manda o admin pro /oauth/authorize.
//   2. melhor-envio-callback → troca o `code` por access+refresh token
//      (exchangeCodeForToken) e salva (saveTokens).
//   3. getValidAccessToken() → usado pelo cálculo de frete. Lê o token,
//      e se estiver perto de vencer, RENOVA sozinho via refresh_token.
//      Assim a conexão nunca "expira" sem alguém perceber.
//
// Config (secrets do Supabase):
//   MELHOR_ENVIO_CLIENT_ID      — Client ID do app (Área Dev.)
//   MELHOR_ENVIO_CLIENT_SECRET  — Client Secret do app
//   MELHOR_ENVIO_BASE           — opcional; produção por padrão
//   META_TOKEN_ENCRYPTION_KEY   — chave AES (já usada pela integração social)
// =============================================================

import { getServiceClient } from "./social_db.ts";
import { decryptToken, encryptToken } from "./social_crypto.ts";

const BASE = (Deno.env.get("MELHOR_ENVIO_BASE") ?? "https://www.melhorenvio.com.br")
  .replace(/\/+$/, "");
const CLIENT_ID = Deno.env.get("MELHOR_ENVIO_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("MELHOR_ENVIO_CLIENT_SECRET") ?? "";
const CONTACT = Deno.env.get("MELHOR_ENVIO_CONTACT") ?? "contato.elarah@gmail.com";

// Escopo mínimo necessário pra cotar frete.
export const MELHOR_ENVIO_SCOPES = "shipping-calculate";
// User-Agent é exigido pela API do Melhor Envio (com contato).
export const MELHOR_ENVIO_USER_AGENT = `Elarah (${CONTACT})`;
// Renova o token quando faltar menos de 2 dias pra vencer.
const REFRESH_SKEW_MS = 2 * 24 * 60 * 60 * 1000;

interface TokenResponse {
  token_type?: string;
  expires_in?: number;
  access_token: string;
  refresh_token?: string;
}

// true quando há credenciais de app configuradas.
export function melhorEnvioConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

// Monta a URL do diálogo de autorização do Melhor Envio.
export function buildAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: MELHOR_ENVIO_SCOPES,
    state,
  });
  return `${BASE}/oauth/authorize?${params.toString()}`;
}

// POST /oauth/token — usado tanto pra trocar `code` quanto pra refresh.
async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": MELHOR_ENVIO_USER_AGENT,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Melhor Envio /oauth/token HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  let json: TokenResponse;
  try {
    json = JSON.parse(text) as TokenResponse;
  } catch {
    throw new Error("Resposta de token inválida do Melhor Envio (não é JSON).");
  }
  if (!json.access_token) {
    throw new Error("Resposta de token do Melhor Envio sem access_token.");
  }
  return json;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  return await postToken({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: redirectUri,
    code,
  });
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return await postToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: MELHOR_ENVIO_SCOPES,
  });
}

// Salva (upsert) os tokens criptografados na linha única id=1.
// O refresh_token só é sobrescrito quando vem na resposta — assim um
// refresh que (por algum motivo) não devolva um novo refresh_token não
// apaga o que já temos.
export async function saveTokens(tok: TokenResponse): Promise<void> {
  const sb = getServiceClient();
  const accessEnc = await encryptToken(tok.access_token);
  const expiresAt = tok.expires_in
    ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
    : null;

  const row: Record<string, unknown> = {
    id: 1,
    access_token_encrypted: accessEnc,
    expires_at: expiresAt,
    scope: MELHOR_ENVIO_SCOPES,
    oauth_state: null,
    oauth_state_expires_at: null,
    updated_at: new Date().toISOString(),
  };
  if (tok.refresh_token) {
    row.refresh_token_encrypted = await encryptToken(tok.refresh_token);
  }

  const { error } = await sb
    .from("melhor_envio_tokens")
    .upsert(row, { onConflict: "id" });
  if (error) throw new Error("Falha ao salvar tokens Melhor Envio: " + error.message);
}

// Devolve um access_token VÁLIDO (renovando se necessário) ou null se
// a integração não está conectada/configurada. Nunca lança — em
// qualquer falha devolve null pra que o cálculo de frete caia no
// fallback (estimativa) sem quebrar o checkout.
export async function getValidAccessToken(): Promise<string | null> {
  if (!melhorEnvioConfigured()) return null;
  let sb;
  try {
    sb = getServiceClient();
  } catch {
    return null;
  }

  const { data, error } = await sb
    .from("melhor_envio_tokens")
    .select("access_token_encrypted, refresh_token_encrypted, expires_at")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data || !data.access_token_encrypted) return null;

  const expMs = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const needsRefresh = !expMs || (expMs - Date.now() < REFRESH_SKEW_MS);

  if (needsRefresh && data.refresh_token_encrypted) {
    try {
      const refreshPlain = await decryptToken(data.refresh_token_encrypted);
      const tok = await refreshAccessToken(refreshPlain);
      await saveTokens(tok);
      return tok.access_token;
    } catch (e) {
      console.warn("[MelhorEnvio] refresh do token falhou", e);
      // Se o atual ainda não venceu de fato, usa ele mesmo.
      if (expMs && expMs > Date.now()) {
        try {
          return await decryptToken(data.access_token_encrypted);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  try {
    return await decryptToken(data.access_token_encrypted);
  } catch {
    return null;
  }
}

// -----------------------------------------------------------
// State CSRF — guardado na própria linha id=1 (one-shot, com TTL).
// -----------------------------------------------------------
export async function setPendingState(
  state: string,
  returnTo: string | null,
  ttlMs = 10 * 60 * 1000,
): Promise<void> {
  const sb = getServiceClient();
  const { error } = await sb.from("melhor_envio_tokens").upsert({
    id: 1,
    oauth_state: state,
    oauth_state_expires_at: new Date(Date.now() + ttlMs).toISOString(),
    return_to: returnTo,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) throw new Error("Falha ao salvar state OAuth Melhor Envio: " + error.message);
}

export async function consumePendingState(
  state: string,
): Promise<{ ok: boolean; returnTo: string | null }> {
  if (!state) return { ok: false, returnTo: null };
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("melhor_envio_tokens")
    .select("oauth_state, oauth_state_expires_at, return_to")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data || !data.oauth_state) return { ok: false, returnTo: null };

  const returnTo = (data.return_to as string | null) ?? null;
  if (data.oauth_state !== state) return { ok: false, returnTo };
  if (
    data.oauth_state_expires_at &&
    new Date(data.oauth_state_expires_at).getTime() < Date.now()
  ) {
    return { ok: false, returnTo };
  }

  // Consome (one-shot): limpa o state.
  await sb
    .from("melhor_envio_tokens")
    .update({ oauth_state: null, oauth_state_expires_at: null })
    .eq("id", 1);

  return { ok: true, returnTo };
}
