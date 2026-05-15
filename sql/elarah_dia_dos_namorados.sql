-- =============================================================
-- ELARAH — Schema da campanha Dia dos Namorados
-- -------------------------------------------------------------
-- 3 tabelas pra suportar:
--   1. Curadoria de experiências por campanha (com título custom)
--   2. Lista de espera de leads ("avise-me quando lançar")
--   3. Experiências "em breve" (cards aspiracionais sem id real)
--
-- DESIGN
--   - `campaign_slug` como chave humana ('dia-dos-namorados', etc.)
--     pra suportar futuras campanhas sem schema novo
--   - RLS: leitura pública pros leitores, escrita só admin (exceto
--     waitlist que aceita INSERT público pra captura de leads)
--   - Idempotente: roda quantas vezes precisar
--
-- PRÉ-REQUISITOS
--   - elarah_supabase_setup.sql (is_admin, set_updated_at)
--   - experiences (referenced by campaign_overrides)
-- =============================================================


-- =============================================================
-- 1. campaign_overrides — título/badge customizado por campanha
-- -------------------------------------------------------------
-- Permite renomear "Pintura em Taça" → "Pintura em Taça — Especial
-- Dia dos Namorados" só dentro da landing da campanha, sem mexer
-- no nome global da experience.
-- =============================================================
create table if not exists public.campaign_overrides (
  id               uuid primary key default gen_random_uuid(),
  campaign_slug    text not null,
  experience_id    uuid not null references public.experiences(id) on delete cascade,
  titulo_custom    text,
  subtitulo_custom text,
  badge_text       text,
  is_featured      boolean not null default false,
  display_order    integer not null default 100,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (campaign_slug, experience_id)
);

create index if not exists idx_campaign_overrides_slug
  on public.campaign_overrides (campaign_slug, display_order);

drop trigger if exists set_campaign_overrides_updated_at on public.campaign_overrides;
create trigger set_campaign_overrides_updated_at
  before update on public.campaign_overrides
  for each row execute function public.set_updated_at();

alter table public.campaign_overrides enable row level security;

drop policy if exists "campaign_overrides_public_read" on public.campaign_overrides;
create policy "campaign_overrides_public_read"
  on public.campaign_overrides for select
  to anon, authenticated using (true);

drop policy if exists "campaign_overrides_admin_all" on public.campaign_overrides;
create policy "campaign_overrides_admin_all"
  on public.campaign_overrides for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================
-- 2. campaign_waitlist — lead capture "avise-me quando lançar"
-- -------------------------------------------------------------
-- Captura pessoas interessadas em experiências futuras ou na
-- campanha como um todo. experience_id é OPCIONAL — null = "alguma
-- experiência dessa campanha".
-- =============================================================
create table if not exists public.campaign_waitlist (
  id               uuid primary key default gen_random_uuid(),
  campaign_slug    text not null,
  experience_id    uuid references public.experiences(id) on delete set null,
  upcoming_id      uuid,   -- aponta pra campaign_upcoming_experiences.id (sem FK pra permitir lead antes do row existir)
  email            text not null,
  nome             text,
  telefone         text,
  mensagem         text,
  source           text,                              -- ex: 'landing-ddn', 'card-em-breve'
  notified_at      timestamptz,                       -- preenchido quando admin avisa o lead
  created_at       timestamptz not null default now()
);

create index if not exists idx_campaign_waitlist_slug
  on public.campaign_waitlist (campaign_slug, created_at desc);

create index if not exists idx_campaign_waitlist_email
  on public.campaign_waitlist (lower(email));

alter table public.campaign_waitlist enable row level security;

-- Admin lê e gerencia tudo
drop policy if exists "campaign_waitlist_admin_all" on public.campaign_waitlist;
create policy "campaign_waitlist_admin_all"
  on public.campaign_waitlist for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Público (anon) só pode INSERT — captura de leads sem login.
-- Email + slug obrigatórios via NOT NULL na coluna; sem SELECT
-- público pra não expor lista pra concorrência.
drop policy if exists "campaign_waitlist_public_insert" on public.campaign_waitlist;
create policy "campaign_waitlist_public_insert"
  on public.campaign_waitlist for insert
  to anon, authenticated
  with check (
    campaign_slug is not null
    and email is not null
    and length(trim(email)) > 4
  );


-- =============================================================
-- 3. campaign_upcoming_experiences — cards aspiracionais "em breve"
-- -------------------------------------------------------------
-- Experiências sem id real ainda — pra mostrar visualmente "está
-- por vir" e captar leads antes do produto existir.
-- =============================================================
create table if not exists public.campaign_upcoming_experiences (
  id               uuid primary key default gen_random_uuid(),
  campaign_slug    text not null,
  nome             text not null,
  categoria        text,
  imagem           text,
  descricao_curta  text,
  expected_label   text,                              -- "início de junho", "em breve", "lançamento dia 5"
  display_order    integer not null default 100,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_campaign_upcoming_slug
  on public.campaign_upcoming_experiences (campaign_slug, display_order);

drop trigger if exists set_campaign_upcoming_updated_at on public.campaign_upcoming_experiences;
create trigger set_campaign_upcoming_updated_at
  before update on public.campaign_upcoming_experiences
  for each row execute function public.set_updated_at();

alter table public.campaign_upcoming_experiences enable row level security;

drop policy if exists "campaign_upcoming_public_read" on public.campaign_upcoming_experiences;
create policy "campaign_upcoming_public_read"
  on public.campaign_upcoming_experiences for select
  to anon, authenticated using (is_active = true);

drop policy if exists "campaign_upcoming_admin_all" on public.campaign_upcoming_experiences;
create policy "campaign_upcoming_admin_all"
  on public.campaign_upcoming_experiences for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================
-- 4. Seed inicial de "em breve" da campanha Dia dos Namorados
-- -------------------------------------------------------------
-- Placeholders aspiracionais — admin substitui no painel.
-- INSERT idempotente via ON CONFLICT (campaign_slug, nome).
-- =============================================================
create unique index if not exists uq_campaign_upcoming_slug_nome
  on public.campaign_upcoming_experiences (campaign_slug, nome);

insert into public.campaign_upcoming_experiences
  (campaign_slug, nome, categoria, descricao_curta, expected_label, display_order)
values
  ('dia-dos-namorados',
   'Jantar Harmonizado a Dois',
   'Gastronomia',
   'Menu de 4 tempos com harmonização exclusiva. Cardápio sendo finalizado.',
   'em breve',
   10),
  ('dia-dos-namorados',
   'Banho de Sons & Aromas',
   'Bem-estar',
   'Experiência sensorial a dois com sound bath, aromaterapia e taça de vinho.',
   'lançamento em junho',
   20),
  ('dia-dos-namorados',
   'Vela do Casal',
   'Vela',
   'Vocês criam uma vela única com fragrância personalizada — memória olfativa que dura.',
   'em breve',
   30)
on conflict (campaign_slug, nome) do nothing;


-- =============================================================
-- 5. Sanity check
-- -------------------------------------------------------------
-- Roda depois pra confirmar:
--
--   select
--     (select count(*) from public.campaign_overrides) as overrides,
--     (select count(*) from public.campaign_waitlist) as waitlist,
--     (select count(*) from public.campaign_upcoming_experiences) as upcoming;
--
-- Esperado em banco virgem após este SQL:
--   overrides = 0  (admin ainda não curou nenhuma experience)
--   waitlist = 0
--   upcoming = 3  (seeds inseridos)
-- =============================================================
