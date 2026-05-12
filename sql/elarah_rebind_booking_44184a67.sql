-- =============================================================
-- ELARAH — Re-vinculação cirúrgica do booking 44184a67
-- -------------------------------------------------------------
-- Restaura slot_id do único booking pago + data futura que ficou
-- órfão pelo bug do saveSlots:
--
--   booking_id  : 44184a67-e1c1-40cb-ae72-863f79eb5344
--   experiencia : Pintura em Taça (05a679ae-650a-4042-810a-0be32ecadf20)
--   data        : 16/05
--   horario     : 13:30 - 15:30 (pode estar como "13h30 – 15h30" no slot)
--   status      : pago
--
-- COMO RODAR
--   Cola tudo no SQL Editor do Supabase e clica Run.
--   Transação única — se algo der errado, rollback automático.
--
-- CRITÉRIO DE MATCH
--   Comparação por dígitos do horário (regex \D removido):
--     "13:30 - 15:30" → "13301530"
--     "13h30 – 15h30" → "13301530"
--   Match exato em (experiencia_id, data, horario_canonico, is_active=true).
--
-- COMPORTAMENTO
--   match=1 → UPDATE faz a re-vinculação
--   match=0 → não faz nada, aborta com NOTICE
--   match>1 → não faz nada, aborta com NOTICE (caso ambíguo)
--
-- IDEMPOTENTE
--   Se já está vinculado, não faz nada.
-- =============================================================

begin;

-- =============================================================
-- 1. ESTADO ANTES — mostra booking + candidatos
-- =============================================================
do $$
declare
  v_booking   record;
  v_horario_canonico_booking text;
begin
  select b.id, b.experiencia_id, b.data, b.horario, b.status, b.slot_id,
         regexp_replace(b.horario, '\D', '', 'g') as h_canon
    into v_booking
    from public.bookings b
   where b.id = '44184a67-e1c1-40cb-ae72-863f79eb5344';

  if v_booking is null then
    raise notice '[ANTES] booking 44184a67 não encontrado — abortando.';
    return;
  end if;

  v_horario_canonico_booking := v_booking.h_canon;

  raise notice '[ANTES] booking_id=%, exp=%, data=%, horario=%, status=%, slot_id=% (canonico=%)',
    v_booking.id, v_booking.experiencia_id, v_booking.data,
    v_booking.horario, v_booking.status, v_booking.slot_id,
    v_horario_canonico_booking;

  raise notice '[ANTES] slots candidatos:';
  for v_booking in
    select s.id, s.horario, s.data, s.event_at, s.is_active, s.vagas_total,
           regexp_replace(s.horario, '\D', '', 'g') as h_canon
      from public.experience_slots s
     where s.experience_id = '05a679ae-650a-4042-810a-0be32ecadf20'
       and coalesce(s.data, '') = '16/05'
       and s.is_active = true
       and regexp_replace(s.horario, '\D', '', 'g') = v_horario_canonico_booking
  loop
    raise notice '   slot_id=%, horario="%", canonico="%", event_at=%, vagas_total=%',
      v_booking.id, v_booking.horario, v_booking.h_canon,
      v_booking.event_at, v_booking.vagas_total;
  end loop;
end $$;


-- =============================================================
-- 2. RE-VINCULAÇÃO CONDICIONAL — só se match único
-- =============================================================
do $$
declare
  v_booking_id uuid := '44184a67-e1c1-40cb-ae72-863f79eb5344';
  v_exp_id     uuid := '05a679ae-650a-4042-810a-0be32ecadf20';
  v_data       text := '16/05';
  v_h_canon    text;
  v_match_count integer;
  v_slot_id    uuid;
  v_current_slot uuid;
begin
  -- Estado atual
  select slot_id into v_current_slot
    from public.bookings
   where id = v_booking_id;

  if v_current_slot is not null then
    raise notice '[REBIND] booking já tem slot_id=% — idempotente, nada a fazer.', v_current_slot;
    return;
  end if;

  -- Canônico do booking
  select regexp_replace(horario, '\D', '', 'g') into v_h_canon
    from public.bookings
   where id = v_booking_id;

  -- Conta matches
  select count(*) into v_match_count
    from public.experience_slots s
   where s.experience_id = v_exp_id
     and coalesce(s.data, '') = v_data
     and s.is_active = true
     and regexp_replace(s.horario, '\D', '', 'g') = v_h_canon;

  if v_match_count = 0 then
    raise notice '[REBIND] 0 slots candidatos — slot original foi deletado e ainda não foi recriado. NADA FEITO.';
    return;
  elsif v_match_count > 1 then
    raise notice '[REBIND] % slots candidatos (ambíguo) — NADA FEITO. Investigar manualmente.', v_match_count;
    return;
  end if;

  -- Match único — pega o id e atualiza
  select s.id into v_slot_id
    from public.experience_slots s
   where s.experience_id = v_exp_id
     and coalesce(s.data, '') = v_data
     and s.is_active = true
     and regexp_replace(s.horario, '\D', '', 'g') = v_h_canon;

  update public.bookings
     set slot_id = v_slot_id
   where id = v_booking_id;

  raise notice '[REBIND] OK — booking % vinculado ao slot %', v_booking_id, v_slot_id;
end $$;


-- =============================================================
-- 3. ESTADO DEPOIS — confirma vínculo + vagas do slot
-- =============================================================
do $$
declare
  v_rec record;
begin
  select b.id as booking_id, b.slot_id, b.status, b.data, b.horario,
         s.id as slot_id_check, s.horario as slot_horario,
         s.event_at, s.vagas_total, s.vagas_restantes
    into v_rec
    from public.bookings b
    left join public.experience_slots s on s.id = b.slot_id
   where b.id = '44184a67-e1c1-40cb-ae72-863f79eb5344';

  raise notice '[DEPOIS] booking=%, slot_id=%, status=%, slot_horario="%", event_at=%, vagas %/%',
    v_rec.booking_id, v_rec.slot_id, v_rec.status, v_rec.slot_horario,
    v_rec.event_at, v_rec.vagas_restantes, v_rec.vagas_total;
end $$;

commit;
