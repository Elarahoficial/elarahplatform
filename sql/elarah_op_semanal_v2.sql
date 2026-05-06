-- =============================================================
-- ELARAH — Rotina Inteligente: tarefas auto-geradas por experiência
-- -------------------------------------------------------------
-- Evoluções da rotina semanal:
--   1. routine_tasks ganha colunas:
--      - experience_id  (uuid, FK → experiences) — tarefas
--        auto-geradas a partir de experiências futuras
--      - kind text — 'template' | 'experience' | 'manual'
--   2. Templates de fim de semana (Sábado + Domingo)
--   3. ensure_routine_week passa a:
--      a) gerar do template (já fazia)
--      b) gerar 3 tarefas POR EXPERIÊNCIA com event_at na semana:
--         - Stories contagem regressiva (dia anterior)
--         - Cobertura do evento (dia)
--         - Repost participantes (dia seguinte, se na semana)
--      c) gerar 2 tarefas DE PREP pra experiências da próxima semana:
--         - Reel + Mensagem grupo (na quinta da semana atual)
--
-- IDEMPOTENTE: unique partial index em
--   (week_start, experience_id, kind, ordem) where experience_id
--   is not null — re-run não duplica.
--
-- REVERSÍVEL: drops com IF EXISTS.
-- =============================================================


-- ===== 1. routine_tasks: novas colunas =====
alter table public.routine_tasks
  add column if not exists experience_id uuid references public.experiences(id) on delete set null,
  add column if not exists kind text;

-- Backfill: tarefas existentes viram 'template' se tiverem template_id, senão 'manual'.
update public.routine_tasks
   set kind = case when template_id is not null then 'template' else 'manual' end
 where kind is null;

alter table public.routine_tasks
  alter column kind set default 'manual',
  alter column kind set not null;

alter table public.routine_tasks
  drop constraint if exists routine_tasks_kind_check;
alter table public.routine_tasks
  add constraint routine_tasks_kind_check
  check (kind in ('template', 'experience', 'manual'));

-- Unique pra evitar duplicação de tarefas de experiência.
-- ordem identifica o sub-tipo (10=countdown, 20=day-of, 30=post,
-- 40=prep-reel, 50=prep-grupo).
create unique index if not exists routine_tasks_unique_per_experience
  on public.routine_tasks (week_start, experience_id, kind, ordem)
  where experience_id is not null;


-- ===== 2. Templates de fim de semana =====
-- Sábado: foco em cobertura/bastidores
-- Domingo: leve, apoio à próxima semana
insert into public.routine_templates (week_day, titulo, responsavel, ordem)
select * from (values
  -- ===== SÁBADO (week_day=5) =====
  (5, 'Cobertura de eventos do dia (se houver)',  'voce',  10),
  (5, 'Gravar bastidores das experiências',       'voce',  20),
  (5, 'Stories de fim de semana / behind the scenes', 'voce', 30),
  (5, 'Coletar depoimentos dos participantes',    'voce',  40),

  -- ===== DOMINGO (week_day=6) =====
  (6, 'Preparar conteúdo da semana que vem',      'voce',  10),
  (6, 'Revisar agenda da próxima semana',         'ambas', 20)
) as v(week_day, titulo, responsavel, ordem)
where not exists (
  select 1 from public.routine_templates rt
   where rt.week_day in (5, 6)
);


-- ===== 3. Helpers internos =====
-- Converte data → week_day no padrão Elarah (0=Seg, 6=Dom).
create or replace function public._op_week_day(d date)
returns smallint
language sql
immutable
as $$
  -- extract(dow) é 0=Dom..6=Sáb. Convertemos pra 0=Seg..6=Dom.
  select ((extract(dow from d)::int + 6) % 7)::smallint;
$$;


-- ===== 4. ensure_routine_week v2 — agora também gera tarefas por experiência =====
-- 3 grupos de inserts, todos idempotentes:
--   A. Templates fixos (já existia)
--   B. Tarefas pra experiências DESTA semana
--   C. Tarefas de prep pra experiências da próxima semana
--
-- Retorna o total inserido na chamada.
create or replace function public.ensure_routine_week(
  p_week_start date
)
returns integer
language plpgsql
security invoker
as $$
declare
  v_total integer := 0;
  v_inserted integer;
  v_next_week_start date := p_week_start + 7;
  v_week_end date := p_week_start + 6;
begin
  -- ===== A. Templates fixos =====
  with novos as (
    insert into public.routine_tasks
      (week_start, week_day, titulo, responsavel, template_id, ordem, kind)
    select
      p_week_start,
      t.week_day,
      t.titulo,
      t.responsavel,
      t.id,
      t.ordem,
      'template'
    from public.routine_templates t
    where t.is_active = true
    on conflict (week_start, template_id) do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- ===== B. Tarefas pra experiências NESTA semana =====
  -- Stories contagem regressiva — dia anterior ao evento.
  -- Se o evento é segunda, joga a contagem na sexta da semana ANTERIOR.
  -- Pra simplificar: só cria countdown se o dia anterior está dentro
  -- da mesma semana (week_start..week_start+6). Caso contrário, vira
  -- tarefa de prep da semana anterior (item C).
  with novos as (
    insert into public.routine_tasks
      (week_start, week_day, titulo, responsavel, experience_id, ordem, kind)
    select
      p_week_start,
      public._op_week_day((e.event_at::date - 1)),
      '📅 Stories contagem regressiva — ' || e.nome,
      'voce',
      e.id,
      10,
      'experience'
    from public.experiences e
    where e.event_at is not null
      and coalesce(e.is_test, false) = false
      and coalesce(e.is_active, true) = true
      and (e.event_at::date - 1) >= p_week_start
      and (e.event_at::date - 1) <= v_week_end
    on conflict (week_start, experience_id, kind, ordem) do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- Cobertura do evento — no dia.
  with novos as (
    insert into public.routine_tasks
      (week_start, week_day, titulo, responsavel, experience_id, ordem, kind)
    select
      p_week_start,
      public._op_week_day(e.event_at::date),
      '🎉 Cobertura do evento — ' || e.nome,
      'voce',
      e.id,
      20,
      'experience'
    from public.experiences e
    where e.event_at is not null
      and coalesce(e.is_test, false) = false
      and coalesce(e.is_active, true) = true
      and e.event_at::date >= p_week_start
      and e.event_at::date <= v_week_end
    on conflict (week_start, experience_id, kind, ordem) do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- Repost participantes — dia seguinte ao evento (se ainda na semana).
  with novos as (
    insert into public.routine_tasks
      (week_start, week_day, titulo, responsavel, experience_id, ordem, kind)
    select
      p_week_start,
      public._op_week_day((e.event_at::date + 1)),
      '♻️ Repost participantes / coleta depoimento — ' || e.nome,
      'voce',
      e.id,
      30,
      'experience'
    from public.experiences e
    where e.event_at is not null
      and coalesce(e.is_test, false) = false
      and coalesce(e.is_active, true) = true
      and (e.event_at::date + 1) >= p_week_start
      and (e.event_at::date + 1) <= v_week_end
    on conflict (week_start, experience_id, kind, ordem) do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- ===== C. Tarefas de PREP pra experiências da PRÓXIMA semana =====
  -- Cai na quinta-feira (week_day=3) da semana atual.
  -- Reel de divulgação.
  with novos as (
    insert into public.routine_tasks
      (week_start, week_day, titulo, responsavel, experience_id, ordem, kind)
    select
      p_week_start,
      3,                                          -- quinta
      '🎬 Gravar Reel de divulgação — ' || e.nome,
      'voce',
      e.id,
      40,
      'experience'
    from public.experiences e
    where e.event_at is not null
      and coalesce(e.is_test, false) = false
      and coalesce(e.is_active, true) = true
      and e.event_at::date >= v_next_week_start
      and e.event_at::date <  v_next_week_start + 7
    on conflict (week_start, experience_id, kind, ordem) do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- Mensagem grupo WhatsApp.
  with novos as (
    insert into public.routine_tasks
      (week_start, week_day, titulo, responsavel, experience_id, ordem, kind)
    select
      p_week_start,
      3,                                          -- quinta
      '💬 Mensagem grupo WhatsApp — ' || e.nome,
      'voce',
      e.id,
      50,
      'experience'
    from public.experiences e
    where e.event_at is not null
      and coalesce(e.is_test, false) = false
      and coalesce(e.is_active, true) = true
      and e.event_at::date >= v_next_week_start
      and e.event_at::date <  v_next_week_start + 7
    on conflict (week_start, experience_id, kind, ordem) do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  return v_total;
end;
$$;

grant execute on function public.ensure_routine_week(date)
  to authenticated, service_role;


notify pgrst, 'reload schema';
