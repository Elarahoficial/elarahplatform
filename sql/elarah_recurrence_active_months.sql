-- =============================================================
-- ELARAH — Recorrência: escolher em QUAIS MESES a regra vale
-- -------------------------------------------------------------
-- PROBLEMA
--   Muitos ateliês mudam a agenda de mês em mês: "toda quarta" vale
--   em outubro e dezembro, mas novembro não tem aula. Hoje a regra
--   gera datas contínuas por `horizon_weeks` semanas, então a admin
--   precisava criar duas experiências (ou apagar datas na mão).
--
-- SOLUÇÃO
--   Nova coluna `active_months text[]` na regra, com meses no formato
--   ano-mes, ex.: 2026-10 e 2026-12.
--     • NULL ou vazio  → comportamento de sempre: gera as próximas
--                        `horizon_weeks` semanas, todos os meses.
--     • Com meses      → gera TODAS as datas dos dias da semana da
--                        regra DENTRO dos meses marcados (de hoje até o
--                        fim do último mês marcado). `horizon_weeks` é
--                        ignorado nesse caso. Meses fora da lista não
--                        recebem nenhuma data.
--
--   O mês leva o ano junto de propósito: "outubro" de 2026 não pode
--   voltar sozinho em outubro de 2027.
--
-- GARANTIAS (mesmas de antes)
--   ✅ Idempotente (ON CONFLICT)
--   ✅ Slot com reserva (pending/pago) nunca é alterado
--   ✅ Regra inativa não gera nada
--   ✅ Só datas >= hoje
--   A remoção das datas que ficaram FORA dos meses (quando a admin
--   desmarca um mês) é feita pelo painel ao salvar a regra — do mesmo
--   jeito que já acontece quando um dia da semana é desmarcado: sem
--   reserva → apaga; com reserva → vira turma manual e fica.
--
-- PRÉ-REQUISITOS
--   elarah_experience_recurrence_multi_weekdays.sql e
--   elarah_recurrence_event_at_sync.sql já rodados.
--
-- IDEMPOTENTE. Como rodar: Supabase → SQL Editor → cola → Run.
--
-- ROLLBACK
--   Rode de novo sql/elarah_recurrence_event_at_sync.sql (volta a
--   função antiga) e depois:
--     alter table public.experience_recurrence_rules
--       drop column if exists active_months;
-- =============================================================


-- ===== 1. Coluna active_months =====
alter table public.experience_recurrence_rules
  add column if not exists active_months text[];

-- Cada elemento precisa ser ano-mes (4 digitos, traco, 01 a 12). CHECK
-- nao aceita subquery, entao valida a lista inteira juntada por virgula.
-- Ancoras \A e \Z (em vez de ^ e cifrao) de proposito: o SQL Editor do
-- Supabase se confunde com cifrao solto dentro de string.
do $chk$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'experience_recurrence_rules'
      and constraint_name = 'recurrence_rules_active_months_valid'
  ) then
    alter table public.experience_recurrence_rules
      add constraint recurrence_rules_active_months_valid
      check (
        active_months is null
        or cardinality(active_months) = 0
        or array_to_string(active_months, ',')
             ~ '\A[0-9]{4}-(0[1-9]|1[0-2])(,[0-9]{4}-(0[1-9]|1[0-2]))*\Z'
      );
  end if;
end $chk$;


-- ===== 2. materialize_recurrence_slots respeitando os meses =====
create or replace function public.materialize_recurrence_slots(p_rule_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_rule       public.experience_recurrence_rules%rowtype;
  v_today      date := current_date;
  v_has_months boolean;
  v_end        date;
  v_target     date;
  v_event_at   timestamptz;
  v_data_lbl   text;
  v_inserted   integer := 0;
begin
  select * into v_rule
    from public.experience_recurrence_rules
   where id = p_rule_id;

  if not found then
    return 0;
  end if;
  if not v_rule.is_active then
    return 0;
  end if;

  v_has_months := coalesce(cardinality(v_rule.active_months), 0) > 0;

  if v_has_months then
    -- Até o último dia do último mês marcado. Teto de ~13 meses pra
    -- um mês digitado errado (ex.: 2099-01) não gerar milhares de datas.
    select (max(to_date(m, 'YYYY-MM')) + interval '1 month' - interval '1 day')::date
      into v_end
      from unnest(v_rule.active_months) as m;
    v_end := least(v_end, v_today + 400);
  else
    -- Comportamento de sempre: horizon_weeks semanas a partir de hoje.
    v_end := v_today + (v_rule.horizon_weeks * 7) - 1;
  end if;

  if v_end < v_today then
    return 0;  -- todos os meses marcados já passaram
  end if;

  for v_target in
    select d::date
      from generate_series(v_today, v_end, interval '1 day') as d
     where extract(dow from d)::int = any (v_rule.weekdays)
       and (not v_has_months
            or to_char(d, 'YYYY-MM') = any (v_rule.active_months))
     order by d
  loop
    v_event_at := (v_target::text || ' ' || v_rule.hora_inicio::text)
                    ::timestamp at time zone 'America/Sao_Paulo';
    v_data_lbl := to_char(v_target, 'DD/MM');

    insert into public.experience_slots (
      experience_id, data, horario, vagas_total, vagas_restantes, event_at,
      recurrence_rule_id, is_active
    )
    values (
      v_rule.experience_id, v_data_lbl, v_rule.horario_label,
      v_rule.vagas_total, v_rule.vagas_total, v_event_at,
      v_rule.id, true
    )
    on conflict (experience_id, coalesce(data, ''), horario) do update
      set event_at    = excluded.event_at,
          vagas_total = excluded.vagas_total,
          vagas_restantes = excluded.vagas_total,
          recurrence_rule_id = excluded.recurrence_rule_id
      where public.experience_slots.recurrence_rule_id is not null
        and not exists (
          select 1 from public.bookings b
           where b.slot_id = public.experience_slots.id
             and b.status in ('pending', 'pago')
        );

    if found then
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return v_inserted;
end;
$fn$;


-- ===== 3. Trigger passa a observar active_months também =====
drop trigger if exists materialize_recurrence_after_change on public.experience_recurrence_rules;
create trigger materialize_recurrence_after_change
  after insert or update of weekdays, hora_inicio, horario_label, vagas_total,
                            horizon_weeks, is_active, active_months
  on public.experience_recurrence_rules
  for each row execute function public.trigger_materialize_recurrence();

notify pgrst, 'reload schema';


-- =============================================================
-- Sanity check
--   select column_name, data_type
--     from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'experience_recurrence_rules'
--      and column_name = 'active_months';
--   Esperado: active_months | ARRAY
-- =============================================================
