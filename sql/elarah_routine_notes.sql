-- =============================================================
-- ELARAH — Rotina: notas livres por semana e por mês
-- -------------------------------------------------------------
-- Tabela pra anotações estratégicas dentro do admin (em vez de
-- ficar perdido no WhatsApp). Estrutura simples:
--
--   - 1 nota free-form por semana
--   - 1 nota free-form por mês
--
-- Texto livre — usuário organiza dentro como quiser (markdown,
-- bullets, etc). Sem categorias engessadas que viram fricção.
--
-- Schema:
--   scope          'semana' | 'mes'
--   period_anchor  date — segunda-feira da semana (scope='semana')
--                  ou primeiro dia do mês (scope='mes')
--   conteudo       text livre (até 50KB tranquilo)
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- RLS: admin only via public.is_admin().
-- =============================================================

create table if not exists public.routine_notes (
  id              uuid primary key default gen_random_uuid(),
  scope           text not null check (scope in ('semana', 'mes')),
  period_anchor   date not null,
  conteudo        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- 1 nota por scope+período (UPSERT garante)
  unique (scope, period_anchor)
);

create index if not exists routine_notes_scope_anchor_idx
  on public.routine_notes (scope, period_anchor desc);

drop trigger if exists trg_routine_notes_updated_at on public.routine_notes;
create trigger trg_routine_notes_updated_at
  before update on public.routine_notes
  for each row execute function public.set_updated_at();

alter table public.routine_notes enable row level security;

drop policy if exists "routine_notes_admin_all" on public.routine_notes;
create policy "routine_notes_admin_all"
  on public.routine_notes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
