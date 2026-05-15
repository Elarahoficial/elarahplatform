-- =============================================================
-- ELARAH — Investigação: Cerâmica em Torno (Seg) 15/06 e 22/06
-- -------------------------------------------------------------
-- Read-only. 4 queries específicas pra diagnosticar por que esses
-- 2 slots não aparecem na campanha de Dia dos Namorados.
-- =============================================================


-- =============================================================
-- Q1 — Acha a experiência Cerâmica em Torno (Seg)
-- =============================================================
select
  id,
  nome,
  categoria,
  is_active,
  event_at,
  data
from public.experiences
where lower(nome) like '%cer%mica em torno%' and lower(nome) like '%seg%'
order by nome;


-- =============================================================
-- Q2 — TODOS os slots dessa experiência (sem filtros) em junho
--      Mostra is_active, vagas, recurrence_rule_id
-- =============================================================
select
  s.id as slot_id,
  s.experience_id,
  e.nome,
  s.data,
  s.horario,
  s.event_at,
  s.is_active as slot_active,
  s.vagas_total,
  s.vagas_restantes,
  s.recurrence_rule_id,
  e.is_active as exp_active
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where lower(e.nome) like '%cer%mica em torno%' and lower(e.nome) like '%seg%'
  and s.event_at >= '2026-06-01'::timestamp
  and s.event_at < '2026-07-01'::timestamp
order by s.event_at, s.horario;


-- =============================================================
-- Q3 — A campanha tem essa experiência marcada como featured?
-- =============================================================
select
  o.id as override_id,
  o.titulo_custom,
  o.is_featured,
  o.display_order,
  e.nome,
  e.is_active as exp_active
from public.campaign_overrides o
join public.experiences e on e.id = o.experience_id
where o.campaign_slug = 'dia-dos-namorados'
  and lower(e.nome) like '%cer%mica em torno%' and lower(e.nome) like '%seg%';


-- =============================================================
-- Q4 — Recorrência ativa pra essa experiência? Materializou
--      slots em 15/06 e 22/06 (segundas-feiras)?
-- =============================================================
select
  r.id as rule_id,
  e.nome,
  r.weekdays,
  r.hora_inicio,
  r.hora_fim,
  r.horario_label,
  r.horizon_weeks,
  r.is_active as rule_active,
  (select count(*) from public.experience_slots s
    where s.recurrence_rule_id = r.id
      and s.event_at >= '2026-05-14' and s.event_at < '2026-07-06'
      and s.is_active is true) as slots_na_janela_ddn,
  (select min(s.event_at) from public.experience_slots s
    where s.recurrence_rule_id = r.id and s.is_active is true and s.event_at >= now()) as proximo_slot,
  (select max(s.event_at) from public.experience_slots s
    where s.recurrence_rule_id = r.id and s.is_active is true) as ultimo_slot
from public.experience_recurrence_rules r
join public.experiences e on e.id = r.experience_id
where lower(e.nome) like '%cer%mica em torno%' and lower(e.nome) like '%seg%';
