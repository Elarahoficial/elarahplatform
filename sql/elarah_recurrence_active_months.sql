-- ELARAH — Recorrência: meses em que a regra vale (active_months, ex.: 2026-10).
-- Vazio = como sempre (horizon_weeks). Idempotente. Curto de propósito: cola inteiro.

alter table public.experience_recurrence_rules
  add column if not exists active_months text[];

do $chk$
begin
  if not exists (select 1 from information_schema.table_constraints
                  where table_schema = 'public' and table_name = 'experience_recurrence_rules'
                    and constraint_name = 'recurrence_rules_active_months_valid') then
    alter table public.experience_recurrence_rules
      add constraint recurrence_rules_active_months_valid check (
        active_months is null or cardinality(active_months) = 0
        or array_to_string(active_months, ',')
             ~ '\A[0-9]{4}-(0[1-9]|1[0-2])(,[0-9]{4}-(0[1-9]|1[0-2]))*\Z');
  end if;
end $chk$;

create or replace function public.materialize_recurrence_slots(p_rule_id uuid)
returns integer language plpgsql security definer set search_path = public
as $fn$
declare
  v_rule       public.experience_recurrence_rules%rowtype;
  v_today      date := current_date;
  v_has_months boolean;
  v_end        date;
  v_target     date;
  v_inserted   integer := 0;
begin
  select * into v_rule from public.experience_recurrence_rules where id = p_rule_id;
  if not found or not v_rule.is_active then return 0; end if;

  v_has_months := coalesce(cardinality(v_rule.active_months), 0) > 0;
  if v_has_months then
    -- Até o fim do último mês marcado (teto de ~13 meses).
    select (max(to_date(m, 'YYYY-MM')) + interval '1 month' - interval '1 day')::date
      into v_end from unnest(v_rule.active_months) as m;
    v_end := least(v_end, v_today + 400);
  else
    v_end := v_today + (v_rule.horizon_weeks * 7) - 1;
  end if;

  for v_target in
    select d::date from generate_series(v_today, v_end, interval '1 day') as d
     where extract(dow from d)::int = any (v_rule.weekdays)
       and (not v_has_months or to_char(d, 'YYYY-MM') = any (v_rule.active_months))
  loop
    insert into public.experience_slots (
      experience_id, data, horario, vagas_total, vagas_restantes, event_at,
      recurrence_rule_id, is_active
    ) values (
      v_rule.experience_id, to_char(v_target, 'DD/MM'), v_rule.horario_label,
      v_rule.vagas_total, v_rule.vagas_total,
      (v_target::text || ' ' || v_rule.hora_inicio::text)::timestamp at time zone 'America/Sao_Paulo',
      v_rule.id, true
    )
    on conflict (experience_id, coalesce(data, ''), horario) do update
      set event_at = excluded.event_at,
          vagas_total = excluded.vagas_total,
          vagas_restantes = excluded.vagas_total,
          recurrence_rule_id = excluded.recurrence_rule_id
      where public.experience_slots.recurrence_rule_id is not null
        and not exists (select 1 from public.bookings b
                         where b.slot_id = public.experience_slots.id
                           and b.status in ('pending', 'pago'));
    if found then v_inserted := v_inserted + 1; end if;
  end loop;
  return v_inserted;
end;
$fn$;

drop trigger if exists materialize_recurrence_after_change on public.experience_recurrence_rules;
create trigger materialize_recurrence_after_change
  after insert or update of weekdays, hora_inicio, horario_label, vagas_total,
                            horizon_weeks, is_active, active_months
  on public.experience_recurrence_rules
  for each row execute function public.trigger_materialize_recurrence();

notify pgrst, 'reload schema';
