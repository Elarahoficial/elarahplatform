-- =============================================================
-- ELARAH — Hotfix ensure_routine_week (ON CONFLICT com índice parcial)
-- -------------------------------------------------------------
-- Bug: a função ensure_routine_week usa
--   ON CONFLICT (week_start, template_id) DO NOTHING
-- mas o índice unique é PARCIAL (where template_id is not null).
-- PostgreSQL exige que o WHERE bata pra usar índice parcial em
-- ON CONFLICT — sem isso, dispara erro 42P10:
--   "there is no unique or exclusion constraint matching the
--    ON CONFLICT specification"
--
-- Fix: adiciona WHERE no ON CONFLICT pra casar o índice parcial.
-- Mesmo problema na inserção de tarefas por experiência (kind=experience).
--
-- IDEMPOTENTE: substitui a função inteira.
-- =============================================================

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
    on conflict (week_start, template_id) where template_id is not null do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- ===== B. Tarefas pra experiências NESTA semana =====
  -- Stories contagem regressiva — dia anterior
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
    on conflict (week_start, experience_id, kind, ordem) where experience_id is not null do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- Cobertura do evento — no dia
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
    on conflict (week_start, experience_id, kind, ordem) where experience_id is not null do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- Repost participantes — dia seguinte (se na semana)
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
    on conflict (week_start, experience_id, kind, ordem) where experience_id is not null do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- ===== C. PREP da semana atual pra exp da próxima =====
  -- Reel de divulgação (cai na quinta)
  with novos as (
    insert into public.routine_tasks
      (week_start, week_day, titulo, responsavel, experience_id, ordem, kind)
    select
      p_week_start,
      3,
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
    on conflict (week_start, experience_id, kind, ordem) where experience_id is not null do nothing
    returning 1
  )
  select count(*) into v_inserted from novos;
  v_total := v_total + coalesce(v_inserted, 0);

  -- Mensagem grupo WhatsApp (cai na quinta)
  with novos as (
    insert into public.routine_tasks
      (week_start, week_day, titulo, responsavel, experience_id, ordem, kind)
    select
      p_week_start,
      3,
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
    on conflict (week_start, experience_id, kind, ordem) where experience_id is not null do nothing
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
