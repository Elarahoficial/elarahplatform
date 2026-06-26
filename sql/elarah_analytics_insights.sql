-- =========================================================
-- ELARAH — Log do agente "Onde estamos pecando" (Diagnóstico IA)
-- =========================================================
-- Guarda cada diagnóstico gerado pela Edge Function
-- analytics-insights. O painel admin lê SEMPRE o mais recente
-- daqui — então ele se atualiza sozinho, sem ninguém clicar.
--
-- Idempotente: pode rodar várias vezes.
--
-- Depende de:
--   * public.is_admin() (helper SECURITY DEFINER já criado no
--     elarah_supabase_setup.sql)
-- =========================================================

create table if not exists public.analytics_insights_runs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  period_days  integer not null default 30,
  model        text,
  trigger      text,                       -- 'cron' | 'manual'
  saude_geral  text,                       -- 'boa' | 'atencao' | 'critica'
  metrics      jsonb not null default '{}'::jsonb,
  insights     jsonb not null default '{}'::jsonb,
  emailed      boolean not null default false
);

create index if not exists analytics_insights_runs_created_idx
  on public.analytics_insights_runs (created_at desc);

alter table public.analytics_insights_runs enable row level security;

-- Admin: pode ler o histórico de diagnósticos (o painel usa isso).
drop policy if exists "analytics_insights_admin_read" on public.analytics_insights_runs;
create policy "analytics_insights_admin_read"
  on public.analytics_insights_runs
  for select
  to authenticated
  using (public.is_admin());

-- IMPORTANTE: não há policy de INSERT. Quem grava é a Edge Function
-- usando o SUPABASE_SERVICE_ROLE_KEY (que ignora RLS por design).
