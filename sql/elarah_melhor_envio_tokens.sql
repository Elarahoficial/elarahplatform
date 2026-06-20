-- =============================================================
-- ELARAH — Tokens OAuth do Melhor Envio (frete real dos Correios)
-- -------------------------------------------------------------
-- Guarda os tokens da integração com o Melhor Envio pra calcular
-- frete real (Correios PAC/SEDEX) na aba Elarah em Casa.
--
-- Linha ÚNICA (id = 1): só existe uma conta Melhor Envio conectada.
-- Os tokens ficam CRIPTOGRAFADOS (AES-GCM, mesma chave da integração
-- social: META_TOKEN_ENCRYPTION_KEY). As colunas oauth_state /
-- oauth_state_expires_at guardam o estado transitório do fluxo de
-- conexão (proteção CSRF) e são limpas assim que o callback conclui.
--
-- Segurança: RLS ligado SEM policies → só o service_role (as Edge
-- Functions) enxerga. anon/authenticated não leem nada. Tokens nunca
-- chegam ao navegador.
--
-- Idempotente. Rode no Supabase (SQL Editor) com usuário admin.
-- =============================================================

create table if not exists public.melhor_envio_tokens (
  id                      smallint primary key default 1,
  access_token_encrypted  text,
  refresh_token_encrypted text,
  expires_at              timestamptz,
  scope                   text,
  -- Estado transitório do fluxo OAuth (CSRF). Limpo após o callback.
  oauth_state             text,
  oauth_state_expires_at  timestamptz,
  return_to               text,
  meta                    jsonb not null default '{}'::jsonb,
  updated_at              timestamptz not null default now(),
  constraint melhor_envio_tokens_single_row check (id = 1)
);

comment on table public.melhor_envio_tokens is
  'Tokens OAuth do Melhor Envio (frete real Correios). Linha única id=1. '
  'Tokens criptografados (AES-GCM). Só Edge Functions (service_role) acessam.';

-- Linha placeholder pra que os upserts (que atualizam id=1) funcionem
-- mesmo antes da primeira conexão.
insert into public.melhor_envio_tokens (id) values (1)
on conflict (id) do nothing;

-- RLS: bloqueia geral. Sem policies = só service_role passa.
alter table public.melhor_envio_tokens enable row level security;
