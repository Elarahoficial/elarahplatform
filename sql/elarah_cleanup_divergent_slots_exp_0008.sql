-- =============================================================
-- ELARAH — Cleanup cirúrgico de slots órfãos da experiência
--          Aula de Tufting (Ter/Qui/Sex) — id 0000...0008
-- -------------------------------------------------------------
-- Bug: _recurrenceCleanupOrphans falhou em edição sequencial da
-- regra, deixando 8 slots de quinta com horario "19h00 – 22h00"
-- enquanto a regra está com label "14h00 – 17h00".
--
-- COMO RODAR
--   Cola tudo no SQL Editor do Supabase e clica Run.
--   Tudo em transação única (BEGIN/COMMIT).
--
-- VERIFICAÇÕES OBRIGATÓRIAS (aborta se qualquer uma falha)
--   1. count divergentes total = 8 (esperado)
--   2. count divergentes com booking ativo = 0 (não tocar reservas)
--
-- COMPORTAMENTO
--   Se ambas as verificações passarem: DELETE os 8 slots.
--   Se qualquer uma falhar: RAISE EXCEPTION → rollback automático.
--
-- TRIGGER BEFORE DELETE
--   Usa flag SET LOCAL elarah.allow_recurrence_slot_delete='true'
--   pra passar pelo trigger enforce_recurrence_slot_delete_trg.
--
-- IDEMPOTENTE
--   Se rodar 2x, na 2ª vez count divergentes=0 → aborta com mensagem
--   clara, sem efeito colateral.
-- =============================================================

begin;

-- Autoriza DELETE de slot vinculado a regra nesta transação
select set_config('elarah.allow_recurrence_slot_delete', 'true', true);

do $$
declare
  v_exp_id           uuid := '00000000-0000-0000-0000-000000000008';
  v_expected_count   integer := 8;
  v_divergent_total  integer;
  v_divergent_booked integer;
  v_rec              record;
  v_deleted          integer;
begin
  -- ============================================================
  -- 1. CONTA divergentes (sem booking)
  -- ============================================================
  select count(*) into v_divergent_total
    from public.experience_slots s
    join public.experience_recurrence_rules r on r.id = s.recurrence_rule_id
   where s.experience_id = v_exp_id
     and r.experience_id = v_exp_id
     and s.horario <> r.horario_label
     and not exists (
       select 1 from public.bookings b
        where b.slot_id = s.id and b.status in ('pending','pago')
     );

  -- ============================================================
  -- 2. CONTA divergentes COM booking (não tocar)
  -- ============================================================
  select count(*) into v_divergent_booked
    from public.experience_slots s
    join public.experience_recurrence_rules r on r.id = s.recurrence_rule_id
   where s.experience_id = v_exp_id
     and r.experience_id = v_exp_id
     and s.horario <> r.horario_label
     and exists (
       select 1 from public.bookings b
        where b.slot_id = s.id and b.status in ('pending','pago')
     );

  raise notice '[cleanup] exp=%, divergentes_sem_booking=%, divergentes_com_booking=% (esperado=%)',
    v_exp_id, v_divergent_total, v_divergent_booked, v_expected_count;

  -- ============================================================
  -- 3. VALIDAÇÕES — qualquer falha aborta
  -- ============================================================
  if v_divergent_booked > 0 then
    raise exception '[cleanup] ABORTANDO: % slot(s) divergente(s) tem booking ativo. Não posso deletar reserva paga. Investigar caso a caso.',
      v_divergent_booked;
  end if;

  if v_divergent_total <> v_expected_count then
    raise exception '[cleanup] ABORTANDO: contagem divergente=% mas esperado=%. Algo mudou desde o diagnóstico — re-rodar query e revalidar antes de prosseguir.',
      v_divergent_total, v_expected_count;
  end if;

  -- ============================================================
  -- 4. LOG do que vai ser deletado (antes do DELETE)
  -- ============================================================
  raise notice '[cleanup] slots que serão deletados:';
  for v_rec in
    select s.id as slot_id, s.data, s.horario, s.event_at,
           r.horario_label as rule_label
      from public.experience_slots s
      join public.experience_recurrence_rules r on r.id = s.recurrence_rule_id
     where s.experience_id = v_exp_id
       and r.experience_id = v_exp_id
       and s.horario <> r.horario_label
     order by s.event_at
  loop
    raise notice '   - slot_id=%, data=%, slot_horario="%", rule_label="%", event_at=%',
      v_rec.slot_id, v_rec.data, v_rec.horario, v_rec.rule_label, v_rec.event_at;
  end loop;

  -- ============================================================
  -- 5. DELETE
  -- ============================================================
  with deleted as (
    delete from public.experience_slots s
     using public.experience_recurrence_rules r
     where r.id = s.recurrence_rule_id
       and s.experience_id = v_exp_id
       and r.experience_id = v_exp_id
       and s.horario <> r.horario_label
       and not exists (
         select 1 from public.bookings b
          where b.slot_id = s.id and b.status in ('pending','pago')
       )
    returning s.id
  )
  select count(*) into v_deleted from deleted;

  if v_deleted <> v_expected_count then
    raise exception '[cleanup] ABORTANDO: DELETE retornou % mas esperado %. Rollback.',
      v_deleted, v_expected_count;
  end if;

  raise notice '[cleanup] OK — % slots deletados, 0 bookings afetados.', v_deleted;
end $$;

-- ============================================================
-- 6. ESTADO DEPOIS — confirma contagem zero
-- ============================================================
do $$
declare
  v_exp_id      uuid := '00000000-0000-0000-0000-000000000008';
  v_remaining   integer;
begin
  select count(*) into v_remaining
    from public.experience_slots s
    join public.experience_recurrence_rules r on r.id = s.recurrence_rule_id
   where s.experience_id = v_exp_id
     and r.experience_id = v_exp_id
     and s.horario <> r.horario_label;

  raise notice '[depois] slots divergentes restantes na exp %: %', v_exp_id, v_remaining;
end $$;

commit;
