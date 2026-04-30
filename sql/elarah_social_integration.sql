-- =========================================================
-- ELARAH — Integração com redes sociais (Instagram inicial,
--          extensível para TikTok e LinkedIn)
-- =========================================================
-- Migration idempotente. Pode ser rodada várias vezes no SQL
-- Editor do Supabase sem efeito colateral.
--
-- Depende de:
--   * public.is_admin()        (helper SECURITY DEFINER já criado em setup)
--   * public.set_updated_at()  (trigger function já criada em setup)
--   * extensão vault           (Supabase Vault — guarda os tokens criptografados)
--
-- Pré-requisitos no painel Supabase (Database → Extensions):
--   * vault    → ON  (provavelmente já está, é nativa do Supabase)
--   * pg_cron  → ON  (necessário pra agendar a sincronização)
--   * pg_net   → ON  (necessário pro cron chamar Edge Functions)
--   * pgcrypto → ON  (já habilitado pelo setup principal)
--
-- Cria quatro tabelas (todas em public, sufixo "social_"):
--   1. social_accounts      — conexão OAuth (1 por conta de rede social)
--   2. social_posts         — snapshot mais recente de cada post publicado
--   3. social_post_metrics  — histórico de métricas (1 linha por sincronização)
--   4. social_sync_runs     — log auditável de cada execução de sync
--
-- O esquema é "provider-agnóstico": Instagram, TikTok e LinkedIn
-- vão compartilhar as mesmas tabelas, distinguidos pelo campo
-- `provider`. Isso evita reescrever o painel quando entrar a
-- segunda plataforma.
-- =========================================================


-- =========================================================
-- 0) Extensões necessárias
-- =========================================================
-- vault: já vem por padrão no Supabase, idempotente.
-- pg_cron e pg_net são habilitadas via painel; aqui só
-- garantimos que elas estão visíveis pro schema correto.
create extension if not exists "pgcrypto";
create extension if not exists "pg_net" with schema "extensions";
-- pg_cron precisa ser instalada no schema "extensions" pelo
-- painel do Supabase. Não dá pra criar via SQL no plano free
-- sem ajuda do dashboard. Comentado pra não falhar:
-- create extension if not exists "pg_cron" with schema "extensions";


-- =========================================================
-- 1) social_accounts
--    Uma linha por conta conectada (Instagram da Elarah,
--    TikTok da Elarah, etc). Guarda referências (UUIDs) para
--    os secrets no Vault — token cru NUNCA fica nessa tabela.
-- =========================================================
create table if not exists public.social_accounts (
  id                       uuid primary key default gen_random_uuid(),
  provider                 text not null check (provider in ('instagram','tiktok','linkedin')),
  external_id              text not null,                       -- ig_user_id, tiktok_user_id, linkedin_org_urn
  username                 text,                                -- @elarahoficial
  display_name             text,
  -- Token vai pro Vault. Esses dois campos guardam só o UUID
  -- do secret. Pra ler o token, Edge Function chama
  -- vault.decrypted_secrets via service_role.
  access_token_secret_id   uuid,
  refresh_token_secret_id  uuid,
  token_expires_at         timestamptz,
  scopes                   text[] not null default '{}',
  -- Metadados específicos do provider (page_id do Facebook,
  -- ig_business_account_id, organization URN do LinkedIn etc).
  meta                     jsonb not null default '{}'::jsonb,
  status                   text not null default 'active'
                             check (status in ('active','disconnected','error')),
  last_sync_at             timestamptz,
  last_sync_error          text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (provider, external_id)
);

create index if not exists social_accounts_provider_idx
  on public.social_accounts (provider, status);

drop trigger if exists set_social_accounts_updated_at on public.social_accounts;
create trigger set_social_accounts_updated_at
before update on public.social_accounts
for each row execute function public.set_updated_at();

alter table public.social_accounts enable row level security;

-- Admin vê tudo. Importante: tokens (UUIDs do Vault) ficam
-- visíveis aqui, mas o token CRU continua só no Vault — o UUID
-- por si só não dá acesso a nada sem service_role.
drop policy if exists "social_accounts_admin_select" on public.social_accounts;
create policy "social_accounts_admin_select"
  on public.social_accounts
  for select
  to authenticated
  using (public.is_admin());

-- INSERT/UPDATE/DELETE só por service_role (Edge Functions).
-- Isso bloqueia até admin de mexer manualmente — quem conecta
-- e desconecta é a Edge Function, não SQL na mão.
drop policy if exists "social_accounts_service_write" on public.social_accounts;
create policy "social_accounts_service_write"
  on public.social_accounts
  for all
  to service_role
  using (true)
  with check (true);


-- =========================================================
-- 2) social_posts
--    Estado MAIS RECENTE de cada post. Substitui o
--    localStorage do painel atual.
-- =========================================================
create table if not exists public.social_posts (
  id                       uuid primary key default gen_random_uuid(),
  account_id               uuid references public.social_accounts(id) on delete cascade,
  provider                 text not null,                       -- redundante com account.provider, mas facilita filtro
  external_id              text not null,                       -- id do post na plataforma
  permalink                text,
  type                     text not null
                             check (type in ('reel','story','feed','carrossel','video')),
  posted_at                timestamptz not null,
  caption                  text,
  media_url                text,
  thumbnail_url            text,
  -- Métricas (snapshot atual). Bigint pra acomodar Reels virais.
  views                    bigint not null default 0,
  impressions              bigint not null default 0,
  reach                    bigint not null default 0,
  likes                    bigint not null default 0,
  comments                 bigint not null default 0,
  saves                    bigint not null default 0,
  shares                   bigint not null default 0,
  total_interactions       bigint not null default 0,
  -- Tags: extraídas automaticamente das hashtags da legenda
  -- (#vilamadalena → "vila madalena") + tags adicionadas
  -- manualmente pelo time. O painel já trabalha com isso.
  tags                     text[] not null default '{}',
  -- Payload original da API (debug + auditoria + futuras métricas).
  raw                      jsonb not null default '{}'::jsonb,
  last_metric_sync_at      timestamptz,
  -- Manualmente cadastrado (true) ou puxado por API (false).
  -- Permite manter compat com posts antigos cadastrados no
  -- painel manual antes da integração.
  is_manual                boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (provider, external_id)
);

create index if not exists social_posts_provider_idx
  on public.social_posts (provider);
create index if not exists social_posts_posted_idx
  on public.social_posts (posted_at desc);
create index if not exists social_posts_account_idx
  on public.social_posts (account_id);
create index if not exists social_posts_tags_idx
  on public.social_posts using gin (tags);

drop trigger if exists set_social_posts_updated_at on public.social_posts;
create trigger set_social_posts_updated_at
before update on public.social_posts
for each row execute function public.set_updated_at();

alter table public.social_posts enable row level security;

-- Admin lê tudo (é o usuário do painel).
drop policy if exists "social_posts_admin_select" on public.social_posts;
create policy "social_posts_admin_select"
  on public.social_posts
  for select
  to authenticated
  using (public.is_admin());

-- Admin pode editar manualmente apenas tags e is_manual
-- (campo "raw" e métricas vêm da API). Vamos deixar UPDATE
-- liberado e controlar no front quais campos editamos.
drop policy if exists "social_posts_admin_update" on public.social_posts;
create policy "social_posts_admin_update"
  on public.social_posts
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- INSERT manual (admin cadastrando post antigo que a API não pegou).
drop policy if exists "social_posts_admin_insert" on public.social_posts;
create policy "social_posts_admin_insert"
  on public.social_posts
  for insert
  to authenticated
  with check (public.is_admin());

-- DELETE só admin (raro — geralmente vem da própria plataforma).
drop policy if exists "social_posts_admin_delete" on public.social_posts;
create policy "social_posts_admin_delete"
  on public.social_posts
  for delete
  to authenticated
  using (public.is_admin());

-- Edge Functions (service_role) escrevem livremente — é elas
-- que fazem upsert via API.
drop policy if exists "social_posts_service_write" on public.social_posts;
create policy "social_posts_service_write"
  on public.social_posts
  for all
  to service_role
  using (true)
  with check (true);


-- =========================================================
-- 3) social_post_metrics
--    Snapshot de métricas a cada sincronização. Permite
--    ver "como esse Reel evoluiu nas primeiras 48h" depois.
--    Crescimento estimado: 1 conta * 30 posts ativos * 4
--    syncs/dia = 120 linhas/dia. Sustentável por anos.
-- =========================================================
create table if not exists public.social_post_metrics (
  id                  bigserial primary key,
  post_id             uuid not null references public.social_posts(id) on delete cascade,
  captured_at         timestamptz not null default now(),
  views               bigint default 0,
  impressions         bigint default 0,
  reach               bigint default 0,
  likes               bigint default 0,
  comments            bigint default 0,
  saves               bigint default 0,
  shares              bigint default 0,
  total_interactions  bigint default 0
);

create index if not exists social_post_metrics_post_idx
  on public.social_post_metrics (post_id, captured_at desc);

alter table public.social_post_metrics enable row level security;

drop policy if exists "social_post_metrics_admin_select" on public.social_post_metrics;
create policy "social_post_metrics_admin_select"
  on public.social_post_metrics
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "social_post_metrics_service_write" on public.social_post_metrics;
create policy "social_post_metrics_service_write"
  on public.social_post_metrics
  for all
  to service_role
  using (true)
  with check (true);


-- =========================================================
-- 4) social_sync_runs
--    Log auditável de cada execução do sync. Facilita
--    debug ("por que o sync de ontem não pegou nada?")
--    e monitoring no admin (status do último sync).
-- =========================================================
create table if not exists public.social_sync_runs (
  id                bigserial primary key,
  account_id        uuid references public.social_accounts(id) on delete cascade,
  provider          text not null,
  trigger_source    text not null default 'cron'
                      check (trigger_source in ('cron','manual','webhook','oauth')),
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  posts_inserted    integer not null default 0,
  posts_updated     integer not null default 0,
  posts_skipped     integer not null default 0,
  api_calls         integer not null default 0,
  status            text not null default 'running'
                      check (status in ('running','ok','partial','failed')),
  error             text,
  meta              jsonb not null default '{}'::jsonb
);

create index if not exists social_sync_runs_started_idx
  on public.social_sync_runs (started_at desc);
create index if not exists social_sync_runs_account_idx
  on public.social_sync_runs (account_id, started_at desc);

alter table public.social_sync_runs enable row level security;

drop policy if exists "social_sync_runs_admin_select" on public.social_sync_runs;
create policy "social_sync_runs_admin_select"
  on public.social_sync_runs
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "social_sync_runs_service_write" on public.social_sync_runs;
create policy "social_sync_runs_service_write"
  on public.social_sync_runs
  for all
  to service_role
  using (true)
  with check (true);


-- =========================================================
-- 5) View pública pro admin: posts + nome da conta
--    Atalho que o painel vai consumir em vez de fazer JOIN
--    no client. Performance + clareza no front.
-- =========================================================
create or replace view public.v_social_posts_enriched as
  select
    p.id,
    p.account_id,
    p.provider,
    p.external_id,
    p.permalink,
    p.type,
    p.posted_at,
    p.caption,
    p.media_url,
    p.thumbnail_url,
    p.views,
    p.impressions,
    p.reach,
    p.likes,
    p.comments,
    p.saves,
    p.shares,
    p.total_interactions,
    p.tags,
    p.is_manual,
    p.last_metric_sync_at,
    p.created_at,
    p.updated_at,
    a.username   as account_username,
    a.display_name as account_display_name
  from public.social_posts p
  left join public.social_accounts a on a.id = p.account_id;

-- Views herdam RLS das tabelas-base, mas vamos garantir que
-- só admins acessem.
alter view public.v_social_posts_enriched
  set (security_invoker = on);


-- =========================================================
-- 6) Helper: mascarar credenciais sensíveis ao listar contas
--    Versão "segura" pro front consumir, sem nem o UUID do
--    Vault (que sozinho não vaza nada, mas economiza superfície).
-- =========================================================
create or replace view public.v_social_accounts_safe as
  select
    id,
    provider,
    external_id,
    username,
    display_name,
    scopes,
    meta,
    status,
    token_expires_at,
    last_sync_at,
    last_sync_error,
    created_at,
    updated_at
  from public.social_accounts;

alter view public.v_social_accounts_safe
  set (security_invoker = on);


-- =========================================================
-- 7) Comentários (autodocumentação no banco)
-- =========================================================
comment on table public.social_accounts is
  'Conexão OAuth com plataforma social (Instagram/TikTok/LinkedIn). Tokens ficam no Supabase Vault, referenciados via *_secret_id.';
comment on table public.social_posts is
  'Snapshot atual de cada post. Métricas atualizadas pela Edge Function sync-{provider}. Posts manuais coexistem (is_manual=true).';
comment on table public.social_post_metrics is
  'Histórico de métricas — uma linha por sincronização. Permite analisar evolução do post no tempo.';
comment on table public.social_sync_runs is
  'Log de execução das Edge Functions de sync. Usado pra debug e monitoring no painel.';

-- =========================================================
-- FIM
-- Próxima migration (separada): pg_cron schedule da
-- Edge Function sync-instagram. Vai ser aplicada DEPOIS
-- que a Edge Function estiver deployada.
-- =========================================================
