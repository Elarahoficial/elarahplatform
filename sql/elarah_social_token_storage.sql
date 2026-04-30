-- =========================================================
-- ELARAH — Storage de tokens (OAuth) e estados temporários
-- =========================================================
-- Suplementar à migration elarah_social_integration.sql.
-- Rode no SQL Editor do Supabase APÓS a migration principal.
-- Idempotente — pode rodar múltiplas vezes sem efeito colateral.
--
-- Decisão arquitetural:
--   Em vez de usar Supabase Vault (que demanda configuração no
--   plano Pro pra rodar liso), guardamos os tokens criptografados
--   localmente via AES-GCM (Web Crypto API na Edge Function).
--   A chave de criptografia (META_TOKEN_ENCRYPTION_KEY) fica em
--   variável de ambiente da Edge Function — só Edge Functions com
--   service_role conseguem ler+descriptografar.
--
--   Os campos *_secret_id (uuid) da migration anterior continuam
--   no schema, reservados pra uma migração futura pro Vault sem
--   precisar mudar tabela.
-- =========================================================

-- 1) Adiciona colunas de token criptografado
alter table public.social_accounts
  add column if not exists access_token_encrypted   text,
  add column if not exists refresh_token_encrypted  text,
  add column if not exists token_encryption_version smallint not null default 1;

comment on column public.social_accounts.access_token_encrypted is
  'Token de acesso criptografado em AES-GCM. Formato: base64(iv ‖ ciphertext ‖ tag). Nunca exponha pro client.';
comment on column public.social_accounts.refresh_token_encrypted is
  'Refresh token (quando aplicável — TikTok usa, Instagram não tem refresh).';
comment on column public.social_accounts.token_encryption_version is
  'Versão da chave/algoritmo de criptografia. Permite rotação futura.';


-- 2) Tabela de estados OAuth (CSRF protection)
--    Quando o admin clica "Conectar Instagram", a Edge Function
--    oauth-start gera um state aleatório, salva aqui, e manda na
--    URL do Meta. No retorno, oauth-callback verifica que o state
--    veio dessa tabela e ainda não expirou — só então confia no code.
create table if not exists public.social_oauth_states (
  state          text primary key,
  provider       text not null check (provider in ('instagram','tiktok','linkedin')),
  admin_user_id  uuid references auth.users(id) on delete cascade,
  redirect_uri   text not null,
  return_to      text,                                        -- url do admin pra onde voltar após OAuth
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default (now() + interval '15 minutes'),
  consumed_at    timestamptz                                  -- preenchido quando o callback usa
);

create index if not exists social_oauth_states_expires_idx
  on public.social_oauth_states (expires_at);

alter table public.social_oauth_states enable row level security;

-- Só service_role escreve/lê. Admin nunca acessa direto — o
-- fluxo OAuth é todo backend.
drop policy if exists "social_oauth_states_service_all" on public.social_oauth_states;
create policy "social_oauth_states_service_all"
  on public.social_oauth_states
  for all
  to service_role
  using (true)
  with check (true);


-- 3) Função de limpeza de states expirados
--    Pode ser chamada por pg_cron ou pela própria oauth-callback.
create or replace function public.purge_expired_oauth_states()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  delete from public.social_oauth_states
   where expires_at < now()
      or consumed_at is not null and consumed_at < now() - interval '1 hour';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- 4) Índice auxiliar pra Edge Function buscar conta ativa por provider rapidamente
create index if not exists social_accounts_active_provider_idx
  on public.social_accounts (provider) where status = 'active';

-- =========================================================
-- FIM
-- =========================================================
