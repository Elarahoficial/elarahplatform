-- =============================================================
-- ELARAH — Fix: recorrente Semanal não reativa ("0 turmas recriadas")
-- -------------------------------------------------------------
-- SINTOMA
--   Apertar "Reativar" numa experiência Semanal mostra o toast
--   "✓ Experiência reativada — 0 turmas futuras recriadas" e ela
--   continua Oculta / sumida do site. O botão chama o RPC
--   materialize_recurrence_slots, que devolve 0.
--
-- CAUSA RAIZ
--   materialize_recurrence_slots insere os slots com
--     on conflict (experience_id, coalesce(data,''), horario) do nothing
--   e o índice unique experience_slots_uq é
--     (experience_id, coalesce(data,''), horario)
--   com `data` = rótulo "DD/MM" SEM ANO. Um slot velho "25/07"
--   (event_at de 2025, no passado) colide com o novo "25/07" (2026):
--   o do-nothing NÃO insere a turma futura e deixa a velha vencida.
--   Resultado: 0 turmas novas e a experiência presa como Oculta.
--
-- CORREÇÃO
--   Troca o `do nothing` por `do update` que RENOVA o slot vencido —
--   joga o event_at pra data futura, reativa e devolve as vagas.
--   Trava com WHERE pra ser seguro:
--     • só renova slots VENCIDOS (event_at nulo ou < agora) — nunca
--       mexe numa turma futura já válida (evita duplicar/deslocar).
--     • pula slots com reserva ativa (pending/pago) — preserva o
--       histórico de turmas que já aconteceram e foram vendidas.
--   Assim, experiências sem reserva (ex.: 96/96) voltam na hora, e
--   nada de histórico é corrompido.
--
-- IDEMPOTENTE
--   Pode rodar quantas vezes quiser. No fim, re-materializa todas as
--   regras ativas pra curar de uma vez as que já estavam presas.
--
-- Rode no SQL Editor do Supabase (usa service_role, bypassa RLS).
-- =============================================================

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

  -- Loop externo: cada dia da semana incluído na regra
  foreach v_target_wd in array v_rule.weekdays loop
    v_offset := (v_target_wd - v_dow_today + 7) % 7;

    -- Loop interno: cada semana dentro do horizon
    for v_step in 0 .. (v_rule.horizon_weeks - 1) loop
      v_target := v_today + (v_offset + v_step * 7);

      v_event_at := (v_target::text || ' ' || v_rule.hora_inicio::text)
                      ::timestamp at time zone 'America/Sao_Paulo';
      v_data_lbl := to_char(v_target, 'DD/MM');

      insert into public.experience_slots (
        experience_id, data, horario, vagas_total, event_at,
        recurrence_rule_id, is_active
      )
      values (
        v_rule.experience_id, v_data_lbl, v_rule.horario_label,
        v_rule.vagas_total, v_event_at,
        v_rule.id, true
      )
      -- RENOVA o slot vencido em vez de ignorar (antes: do nothing).
      -- WHERE garante segurança: só toca em turma vencida (event_at
      -- nulo ou no passado) E sem reserva ativa. Turma futura válida
      -- ou com reserva paga NÃO é alterada.
      on conflict (experience_id, coalesce(data, ''), horario) do update
        set event_at           = excluded.event_at,
            is_active          = true,
            vagas_total        = excluded.vagas_total,
            vagas_restantes    = excluded.vagas_total,
            recurrence_rule_id = excluded.recurrence_rule_id,
            updated_at         = now()
      where (public.experience_slots.event_at is null
             or public.experience_slots.event_at < now())
        and not exists (
          select 1 from public.bookings b
          where b.slot_id = public.experience_slots.id
            and b.status in ('pending', 'pago')
        );

      -- FOUND é true tanto no INSERT quanto no DO UPDATE que passou no
      -- WHERE — conta as turmas realmente criadas OU renovadas.
      if found then
        v_inserted := v_inserted + 1;
      end if;
    end loop;
  end loop;

  return v_inserted;
end;
$$;


-- =============================================================
-- Cura imediata: re-materializa TODAS as regras ativas agora.
-- Devolve, por experiência, quantas turmas foram criadas/renovadas.
-- =============================================================
do $$
declare
  r          record;
  v_count    integer;
  v_total    integer := 0;
begin
  for r in
    select rr.id, rr.experience_id, e.nome
      from public.experience_recurrence_rules rr
      join public.experiences e on e.id = rr.experience_id
     where rr.is_active = true
  loop
    v_count := public.materialize_recurrence_slots(r.id);
    v_total := v_total + coalesce(v_count, 0);
    raise notice 'Regra % (%): % turma(s) criada(s)/renovada(s)',
      r.id, r.nome, v_count;
  end loop;
  raise notice '=== TOTAL: % turma(s) criada(s)/renovada(s) ===', v_total;
end $$;


-- =============================================================
-- Conferência: lista as próximas turmas futuras por experiência
-- recorrente (deve aparecer datas no futuro pra cada uma).
-- =============================================================
select e.nome,
       s.horario,
       s.data,
       s.event_at,
       s.vagas_restantes || '/' || s.vagas_total as vagas
  from public.experience_slots s
  join public.experiences e on e.id = s.experience_id
 where s.recurrence_rule_id is not null
   and s.event_at >= now()
   and s.is_active = true
 order by e.nome, s.event_at
 limit 100;
