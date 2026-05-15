-- =============================================================
-- ELARAH — Investigação AMPLA: por que só 8 entraram?
-- -------------------------------------------------------------
-- Read-only. 7 queries de diagnóstico que cobrem TODOS os
-- possíveis pontos de falha.
--
-- Rode UMA query de cada vez e me mande o resultado de cada.
-- =============================================================


-- =============================================================
-- Q1 — Quantas experiências ativas existem no total?
-- =============================================================
select
  count(*) as total,
  count(*) filter (where is_active is true) as ativas,
  count(*) filter (where is_active is false) as inativas,
  count(*) filter (where is_active is null) as is_active_null
from public.experiences;


-- =============================================================
-- Q2 — TODOS slots na janela 14/05–06/07 (SEM filtros)
--      Não filtra is_active, não filtra vagas. Mostra tudo.
-- =============================================================
select
  count(*) as total_slots,
  count(*) filter (where is_active is true) as slots_ativos,
  count(*) filter (where is_active is false) as slots_inativos,
  count(*) filter (where vagas_total is null or vagas_restantes > 0) as com_vagas,
  count(*) filter (where vagas_restantes = 0) as esgotados,
  count(distinct experience_id) as experiencias_unicas
from public.experience_slots
where event_at >= '2026-05-14'::timestamp
  and event_at < '2026-07-06'::timestamp;


-- =============================================================
-- Q3 — Lista TODAS experiências ativas COM slot ativo na janela
--      (sem dedup, sem filtro de vagas). Quero ver o universo real.
-- =============================================================
select
  e.id,
  e.nome,
  e.categoria,
  e.is_active as exp_active,
  count(s.id) as slots_count,
  min(s.event_at) as primeira_data,
  max(s.event_at) as ultima_data,
  count(s.id) filter (where s.is_active is false) as slots_inativos,
  count(s.id) filter (where s.vagas_restantes = 0) as slots_esgotados
from public.experiences e
join public.experience_slots s on s.experience_id = e.id
where s.event_at >= '2026-05-14'::timestamp
  and s.event_at < '2026-07-06'::timestamp
group by e.id, e.nome, e.categoria, e.is_active
order by primeira_data, e.nome;


-- =============================================================
-- Q4 — Procura especificamente as experiências fortes que NÃO
--      apareceram (Pintura em Taça, Vela Aromática, Drinks).
--      Mostra TUDO sobre elas, sem filtro de janela.
-- =============================================================
select
  e.id,
  e.nome,
  e.categoria,
  e.is_active,
  e.event_at as exp_event_at,
  e.data as exp_data_texto,
  (select count(*) from public.experience_slots s where s.experience_id = e.id) as slots_total,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id and s.is_active is true) as slots_ativos,
  (select min(s.event_at) from public.experience_slots s
    where s.experience_id = e.id and s.is_active is true
      and s.event_at >= now()) as proximo_slot_futuro
from public.experiences e
where lower(e.nome) ~ 'pintura em ta[çc]a|vela arom|drinks?|coquetel|negroni|wine'
order by e.nome;


-- =============================================================
-- Q5 — Slots ativos com vagas dispnoíveis na janela ampla
--      (até 31/07) — pra entender se a janela é o problema
-- =============================================================
select
  count(distinct s.experience_id) filter (where s.event_at >= '2026-05-14' and s.event_at < '2026-05-21') as semana_pre_ddn,
  count(distinct s.experience_id) filter (where s.event_at >= '2026-05-21' and s.event_at < '2026-06-12') as antes_ddn,
  count(distinct s.experience_id) filter (where s.event_at >= '2026-06-12' and s.event_at < '2026-06-30') as pos_ddn,
  count(distinct s.experience_id) filter (where s.event_at >= '2026-06-30' and s.event_at < '2026-07-31') as julho
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where s.is_active is true
  and e.is_active is true
  and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0);


-- =============================================================
-- Q6 — Recorrência: experiências com rule ativa, quantos slots
--      foram materializados em junho? Pra detectar se a recorrência
--      não está estendendo até junho.
-- =============================================================
select
  r.id as rule_id,
  e.nome,
  e.categoria,
  r.weekdays,
  r.hora_inicio,
  r.horizon_weeks,
  r.is_active as rule_active,
  e.is_active as exp_active,
  (select count(*) from public.experience_slots s
    where s.recurrence_rule_id = r.id
      and s.event_at >= '2026-05-14' and s.event_at < '2026-07-06'
      and s.is_active is true) as slots_na_janela
from public.experience_recurrence_rules r
join public.experiences e on e.id = r.experience_id
where r.is_active = true
order by e.nome;


-- =============================================================
-- Q7 — Reproduz a query EXATA do algoritmo de curadoria,
--      sem o DISTINCT ON, pra ver o universo bruto que ele
--      considera (vs o que filtra).
-- =============================================================
select
  e.nome,
  e.categoria,
  e.is_active as exp_active,
  s.event_at,
  s.is_active as slot_active,
  s.vagas_total,
  s.vagas_restantes
from public.experiences e
join public.experience_slots s on s.experience_id = e.id
where e.is_active = true
  and s.is_active = true
  and s.event_at >= '2026-05-14'::timestamp
  and s.event_at < '2026-07-06'::timestamp
  and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
order by e.nome, s.event_at;
