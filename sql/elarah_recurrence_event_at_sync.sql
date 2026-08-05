-- =============================================================
-- ELARAH — Recorrência: propaga mudança de HORÁRIO pros slots já criados
-- -------------------------------------------------------------
-- BUG (variação de horário não é cumprida):
--   materialize_recurrence_slots usava ON CONFLICT DO NOTHING. Quando o
--   admin CORRIGIA o horário de uma regra (ex.: hora_inicio 19h → 20h)
--   mantendo o rótulo, todos os slots FUTUROS já materializados batiam no
--   conflito e ficavam com o event_at ANTIGO. O novo horário só valia pra
--   datas novas além do horizonte → as turmas que os clientes estão
--   reservando AGORA continuavam no horário errado (cutoff, agrupamento por
--   data e o horário salvo/e-mail refletiam o valor velho).
--
-- CORREÇÃO:
--   1. materialize_recurrence_slots passa a DO UPDATE o event_at (e
--      vagas_total/vagas_restantes) dos slots da PRÓPRIA regra que ainda
--      NÃO têm reserva. Slots com reserva (pending/pago) são preservados —
--      não movemos o horário de quem já comprou; esses o admin ajusta à mão.
--   2. Re-materializa todas as regras ativas pra aplicar já ao estado atual.
--   3. Corrige slots cujo event_at foi FABRICADO em 18:00 por um backfill
--      antigo (elarah_backfill_slots_event_at.sql), recomputando a HORA a
--      partir do rótulo `horario` (mantém a DATA).
--
-- IDEMPOTENTE. Como rodar: Supabase → SQL Editor → cola → Run.
-- =============================================================

-- ===== 1. materialize_recurrence_slots com DO UPDATE (só slots sem reserva) =====
create or replace function public.materialize_recurrence_slots(p_rule_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule       public.experience_recurrence_rules%rowtype;
  v_today      date := current_date;
  v_dow_today  integer;
  v_target_wd  integer;
  v_offset     integer;
  v_target     date;
  v_event_at   timestamptz;
  v_data_lbl   text;
  v_inserted   integer := 0;
  v_step       integer;
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

  v_dow_today := extract(dow from v_today)::int;

  foreach v_target_wd in array v_rule.weekdays loop
    v_offset := (v_target_wd - v_dow_today + 7) % 7;

    for v_step in 0 .. (v_rule.horizon_weeks - 1) loop
      v_target := v_today + (v_offset + v_step * 7);

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
            -- Sem reserva → restantes = total (o reconcile ajusta depois de qq forma).
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
  end loop;

  return v_inserted;
end;
$$;

-- ===== 2. Re-materializa todas as regras ativas (aplica ao estado atual) =====
do $$
declare
  r record;
begin
  for r in select id from public.experience_recurrence_rules where is_active loop
    perform public.materialize_recurrence_slots(r.id);
  end loop;
end $$;

-- ===== 3. Corrige event_at fabricado em 18:00 (backfill antigo) =====
-- Só toca slots cujo event_at (em SP) está às 18:00 mas o rótulo `horario`
-- começa com uma hora DIFERENTE de 18 — recomputa a HORA a partir do rótulo
-- e MANTÉM a data. Não mexe onde a turma é realmente às 18h.
update public.experience_slots s
   set event_at = (
         to_char((s.event_at at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD')
         || ' '
         || lpad(substring(s.horario from '^\s*(\d{1,2})'), 2, '0')
         || ':'
         || coalesce(substring(s.horario from '^\s*\d{1,2}\s*[h:]\s*(\d{2})'), '00')
         || ':00'
       )::timestamp at time zone 'America/Sao_Paulo'
 where s.event_at is not null
   and s.horario ~ '^\s*\d{1,2}'
   and extract(hour from (s.event_at at time zone 'America/Sao_Paulo')) = 18
   and substring(s.horario from '^\s*(\d{1,2})')::int <> 18;

notify pgrst, 'reload schema';
