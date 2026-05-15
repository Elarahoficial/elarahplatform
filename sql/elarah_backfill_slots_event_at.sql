-- =============================================================
-- ELARAH — Backfill event_at em slots com data textual
-- -------------------------------------------------------------
-- BUG: ~100 slots têm event_at=NULL mas data textual ("DD/MM").
-- Resultado: qualquer query que filtra por event_at exclui essas
-- experiências da campanha DDN.
--
-- FIX: parse "DD/MM" → date do ano 2026, 18:00 BRT (= 21:00 UTC).
-- Também suporta "DD/MM/AAAA".
--
-- IDEMPOTENTE — só toca slots com event_at NULL.
-- =============================================================

-- 1. Slots com data "DD/MM" (sem ano) → assume 2026
update public.experience_slots s
set event_at = (
  '2026-' ||
  lpad(split_part(s.data, '/', 2), 2, '0') || '-' ||
  lpad(split_part(s.data, '/', 1), 2, '0') ||
  ' 18:00:00-03:00'
)::timestamptz
where s.event_at is null
  and s.data is not null
  and s.data ~ '^\d{1,2}/\d{1,2}$';

-- 2. Slots com data "DD/MM/AAAA"
update public.experience_slots s
set event_at = (
  split_part(s.data, '/', 3) || '-' ||
  lpad(split_part(s.data, '/', 2), 2, '0') || '-' ||
  lpad(split_part(s.data, '/', 1), 2, '0') ||
  ' 18:00:00-03:00'
)::timestamptz
where s.event_at is null
  and s.data is not null
  and s.data ~ '^\d{1,2}/\d{1,2}/\d{4}$';

-- 3. Fallback: se slot.data é null mas experience.data tem "DD/MM"
update public.experience_slots s
set event_at = (
  '2026-' ||
  lpad(split_part(e.data, '/', 2), 2, '0') || '-' ||
  lpad(split_part(e.data, '/', 1), 2, '0') ||
  ' 18:00:00-03:00'
)::timestamptz
from public.experiences e
where s.experience_id = e.id
  and s.event_at is null
  and (s.data is null or s.data = '' or s.data = 'Semanal')
  and e.data is not null
  and e.data ~ '^\d{1,2}/\d{1,2}$';


-- =============================================================
-- Sanity check
-- =============================================================
select
  (select count(*) from public.experience_slots where event_at is null) as ainda_sem_event_at,
  (select count(*) from public.experience_slots
    where event_at >= '2026-05-25 00:00:00+00'::timestamptz
      and event_at <  '2026-06-25 23:59:59+00'::timestamptz
      and is_active is not false) as slots_na_janela_ddn,
  (select count(distinct experience_id) from public.experience_slots
    where event_at >= '2026-05-25 00:00:00+00'::timestamptz
      and event_at <  '2026-06-25 23:59:59+00'::timestamptz
      and is_active is not false) as experiencias_na_janela_ddn;
