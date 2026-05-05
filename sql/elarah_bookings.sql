-- =========================================================
-- ELARAH — Bookings (Stripe checkout) — idempotent
-- =========================================================
-- Rode no SQL editor do Supabase. Pode ser executado várias
-- vezes sem efeito colateral.
--
-- Depende de:
--   * public.profiles (já criado em elarah_supabase_setup.sql)
--   * public.experiences (já criado em elarah_supabase_setup.sql)
--   * public.is_admin() (helper SECURITY DEFINER já criado)
--   * public.set_updated_at() (trigger helper já criado)
-- =========================================================

create table if not exists public.bookings (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references auth.users(id) on delete set null,
  email                   text not null,
  nome                    text,
  experiencia_id          uuid references public.experiences(id) on delete set null,
  experiencia_nome        text not null,
  data                    text,
  horario                 text,
  preco_label             text,                 -- preço como exibido (ex.: R$383)
  amount_total            integer,              -- valor pago, em centavos
  currency                text default 'brl',
  status                  text not null default 'pending'
                          check (status in ('pending','pago','cancelado','expirado','reembolsado')),
  stripe_session_id       text unique,
  stripe_payment_intent   text,
  metadata                jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_created_idx on public.bookings (created_at desc);
create index if not exists bookings_exp_idx on public.bookings (experiencia_id);
create index if not exists bookings_user_idx on public.bookings (user_id);

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

-- ===== POLICIES =====
-- Admin: full access (gerencia tudo no painel).
drop policy if exists "bookings_admin_all" on public.bookings;
create policy "bookings_admin_all"
  on public.bookings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Usuário logado: pode ler suas próprias reservas (área conta).
drop policy if exists "bookings_owner_select" on public.bookings;
create policy "bookings_owner_select"
  on public.bookings
  for select
  to authenticated
  using (auth.uid() = user_id);

-- IMPORTANTE: não há policy de INSERT para anon/authenticated.
-- Inserts e updates só acontecem via Edge Function usando o
-- SUPABASE_SERVICE_ROLE_KEY (que ignora RLS por design).
