// =============================================================
// ELARAH — Helpers de banco para integração de redes sociais
// -------------------------------------------------------------
// Encapsula:
//   - Cliente Supabase com service_role (bypass RLS, só Edge
//     Functions usam).
//   - Validação "esse JWT é de um admin?" — usado pra autorizar
//     ações sensíveis tipo iniciar OAuth.
//   - Persistência de OAuth state e de social_accounts.
// =============================================================

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireEnv, type SocialProvider } from "./social_config.ts";
import { generateOAuthState } from "./social_crypto.ts";

// -----------------------------------------------------------
// Cliente service_role — singleton
// -----------------------------------------------------------
let _service: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (_service) return _service;
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  _service = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _service;
}

// -----------------------------------------------------------
// Validação de admin
// -----------------------------------------------------------
// Recebe o Bearer token enviado pelo frontend (JWT do
// supabase-js). Decodifica via supabase auth, depois verifica
// flag is_admin na tabela profiles. Retorna o user_id se admin,
// null caso contrário.
// -----------------------------------------------------------
export async function authorizeAdmin(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!m) return null;
  const jwt = m[1];

  const url = requireEnv("SUPABASE_URL");
  const anon = requireEnv("SUPABASE_ANON_KEY");
  // Cliente "anônimo" só pra validar o JWT do usuário.
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: userData, error } = await client.auth.getUser(jwt);
  if (error || !userData?.user) return null;
  const userId = userData.user.id;

  // Confere is_admin na tabela profiles. Usa o cliente
  // autenticado pelo próprio JWT (RLS aplicada — admin lê o
  // próprio profile mesmo).
  const { data: profile, error: pErr } = await client
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (pErr || !profile?.is_admin) return null;
  return userId;
}

// -----------------------------------------------------------
// OAuth state — armazena/consome
// -----------------------------------------------------------
export async function createOAuthState(opts: {
  provider: SocialProvider;
  adminUserId: string;
  redirectUri: string;
  returnTo: string | null;
}): Promise<string> {
  const sb = getServiceClient();
  const state = generateOAuthState();
  const { error } = await sb.from("social_oauth_states").insert({
    state,
    provider: opts.provider,
    admin_user_id: opts.adminUserId,
    redirect_uri: opts.redirectUri,
    return_to: opts.returnTo,
  });
  if (error) throw new Error("Falha ao salvar state OAuth: " + error.message);
  return state;
}

export interface OAuthStateRow {
  state: string;
  provider: SocialProvider;
  admin_user_id: string;
  redirect_uri: string;
  return_to: string | null;
  expires_at: string;
  consumed_at: string | null;
}

// Consome um state: lê e marca consumed_at. Retorna null se
// o state for inválido, expirado ou já consumido (one-shot).
export async function consumeOAuthState(state: string): Promise<OAuthStateRow | null> {
  if (!state) return null;
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("social_oauth_states")
    .select("*")
    .eq("state", state)
    .maybeSingle();

  if (error || !data) return null;
  if (data.consumed_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  await sb
    .from("social_oauth_states")
    .update({ consumed_at: new Date().toISOString() })
    .eq("state", state);

  return data as OAuthStateRow;
}

// -----------------------------------------------------------
// Persistência de social_accounts
// -----------------------------------------------------------
export interface UpsertAccountInput {
  provider: SocialProvider;
  externalId: string;
  username: string | null;
  displayName: string | null;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: string | null;
  scopes: string[];
  meta: Record<string, unknown>;
}

export async function upsertSocialAccount(input: UpsertAccountInput): Promise<{ id: string }> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("social_accounts")
    .upsert(
      {
        provider: input.provider,
        external_id: input.externalId,
        username: input.username,
        display_name: input.displayName,
        access_token_encrypted: input.accessTokenEncrypted,
        refresh_token_encrypted: input.refreshTokenEncrypted,
        token_expires_at: input.tokenExpiresAt,
        scopes: input.scopes,
        meta: input.meta,
        status: "active",
        last_sync_error: null,
        token_encryption_version: 1,
      },
      { onConflict: "provider,external_id" },
    )
    .select("id")
    .single();

  if (error) throw new Error("Falha ao salvar conta social: " + error.message);
  return { id: data.id as string };
}
