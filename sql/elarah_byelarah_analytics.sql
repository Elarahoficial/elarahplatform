-- =========================================================
-- ELARAH — By Elarah + Analytics migration (idempotent)
-- =========================================================
-- Rode este arquivo no SQL editor do Supabase. Pode ser
-- executado várias vezes sem efeito colateral.
--
-- Depende de:
--   * public.profiles (já criado em elarah_supabase_setup.sql)
--   * public.is_admin() (helper SECURITY DEFINER já criado)
--
-- Cria três tabelas:
--   1. public.byelarah_items        — cards da seção By Elarah
--   2. public.byelarah_submissions  — respostas de formulário
--   3. public.analytics_events      — eventos de analytics
-- =========================================================

-- ===================== 1. BYELARAH_ITEMS =====================
create table if not exists public.byelarah_items (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  nome         text not null,
  descricao    text not null default '',
  imagem       text not null default '',
  data         text not null default '',
  local        text not null default '',
  horarios     jsonb not null default '[]'::jsonb,
  tipo         text not null default 'espera' check (tipo in ('participar','espera')),
  ordem        integer not null default 0,
  ativo        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists byelarah_items_ordem_idx
  on public.byelarah_items (ordem asc, created_at asc);

-- trigger de updated_at (usa set_updated_at criado no setup)
drop trigger if exists set_byelarah_items_updated_at on public.byelarah_items;
create trigger set_byelarah_items_updated_at
before update on public.byelarah_items
for each row execute function public.set_updated_at();

alter table public.byelarah_items enable row level security;

drop policy if exists "byelarah_items_select_public" on public.byelarah_items;
create policy "byelarah_items_select_public"
  on public.byelarah_items
  for select
  using (true);

drop policy if exists "byelarah_items_admin_all" on public.byelarah_items;
create policy "byelarah_items_admin_all"
  on public.byelarah_items
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===================== 2. BYELARAH_SUBMISSIONS =====================
create table if not exists public.byelarah_submissions (
  id             uuid primary key default gen_random_uuid(),
  item_slug      text,
  experiencia    text not null,
  tipo           text not null default 'participar',
  nome           text not null,
  email          text not null,
  telefone       text not null,
  horario        text,
  user_id        uuid references auth.users(id) on delete set null,
  metadata       jsonb not null default '{}'::jsonb,
  status         text not null default 'novo',
  created_at     timestamptz not null default now()
);

create index if not exists byelarah_submissions_created_idx
  on public.byelarah_submissions (created_at desc);
create index if not exists byelarah_submissions_slug_idx
  on public.byelarah_submissions (item_slug);

alter table public.byelarah_submissions enable row level security;

-- Inserts são públicos (anon + authenticated) para que o
-- formulário do index.html funcione mesmo sem login.
drop policy if exists "byelarah_submissions_insert_public" on public.byelarah_submissions;
create policy "byelarah_submissions_insert_public"
  on public.byelarah_submissions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "byelarah_submissions_admin_read" on public.byelarah_submissions;
create policy "byelarah_submissions_admin_read"
  on public.byelarah_submissions
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "byelarah_submissions_admin_update" on public.byelarah_submissions;
create policy "byelarah_submissions_admin_update"
  on public.byelarah_submissions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "byelarah_submissions_admin_delete" on public.byelarah_submissions;
create policy "byelarah_submissions_admin_delete"
  on public.byelarah_submissions
  for delete
  to authenticated
  using (public.is_admin());

-- ===================== 3. ANALYTICS_EVENTS =====================
create table if not exists public.analytics_events (
  id           bigserial primary key,
  event_name   text not null,
  category     text not null default 'general',
  target_id    text,
  target_label text,
  page         text,
  path         text,
  session_id   text,
  user_id      uuid references auth.users(id) on delete set null,
  metadata     jsonb not null default '{}'::jsonb,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_name_idx
  on public.analytics_events (event_name);
create index if not exists analytics_events_page_idx
  on public.analytics_events (page);
create index if not exists analytics_events_category_idx
  on public.analytics_events (category);

alter table public.analytics_events enable row level security;

-- Qualquer visitante (anon ou logado) pode registrar eventos.
drop policy if exists "analytics_events_insert_public" on public.analytics_events;
create policy "analytics_events_insert_public"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "analytics_events_admin_read" on public.analytics_events;
create policy "analytics_events_admin_read"
  on public.analytics_events
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "analytics_events_admin_delete" on public.analytics_events;
create policy "analytics_events_admin_delete"
  on public.analytics_events
  for delete
  to authenticated
  using (public.is_admin());

-- ===================== 4. SEEDS BY ELARAH =====================
-- Carrega os 3 cards originais (mesmo conteúdo do index.html)
-- como fallback visual no banco. Usa slugs fixos, então é
-- idempotente: re-rodar não duplica.

insert into public.byelarah_items (slug, nome, descricao, imagem, data, local, horarios, tipo, ordem)
values
  ('pintura-aperol',
   'Pintura de Quadro com Cristal & Aperol Spritz',
   'Uma tarde criativa para pintar seu próprio quadro com cristais, acompanhada de um Aperol Spritz.',
   'assets/pintura-aperol.png',
   '24 de abril',
   'Rua Nova Orleans, 34 – Brooklin, São Paulo',
   '["10h às 13h","14h às 17h"]'::jsonb,
   'participar',
   1),
  ('perfumaria-criativa',
   'Oficina de Perfumaria Criativa',
   'Descubra notas, combinações e crie uma fragrância única que é a sua cara.',
   'assets/perfumariaa.jpg',
   'Data em breve',
   '',
   '[]'::jsonb,
   'espera',
   2),
  ('ourivesaria-joia',
   'Workshop de Ourivesaria: Crie sua Joia',
   'Uma vivência para conhecer o processo artesanal e criar algo único.',
   'assets/ourivesariaa.jpg',
   'Data em breve',
   '',
   '[]'::jsonb,
   'espera',
   3)
on conflict (slug) do nothing;
