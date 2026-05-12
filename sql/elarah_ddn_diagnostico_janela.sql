-- =============================================================
-- ELARAH — Diagnóstico AMPLO: o que existe na janela 25/05-25/06
-- -------------------------------------------------------------
-- Read-only. 6 queries que cobrem TODA possibilidade de filtragem.
-- Rode UMA query de cada vez e me mande os resultados.
-- =============================================================


-- =============================================================
-- Q1 — Contagens gerais na janela 25/05–25/06
-- =============================================================
select
  (select count(*) from public.experience_slots
    where event_at >= '2026-05-25'::timestamp
      and event_at < '2026-06-25'::timestamp) as slots_na_janela_total,
  (select count(*) from public.experience_slots
    where event_at >= '2026-05-25'::timestamp
      and event_at < '2026-06-25'::timestamp
      and is_active is true) as slots_active_true,
  (select count(*) from public.experience_slots
    where event_at >= '2026-05-25'::timestamp
      and event_at < '2026-06-25'::timestamp
      and is_active is false) as slots_active_false,
  (select count(*) from public.experience_slots
    where event_at >= '2026-05-25'::timestamp
      and event_at < '2026-06-25'::timestamp
      and is_active is null) as slots_active_null,
  (select count(distinct experience_id) from public.experience_slots
    where event_at >= '2026-05-25'::timestamp
      and event_at < '2026-06-25'::timestamp
      and is_active is true) as experiencias_unicas_com_slot;


-- =============================================================
-- Q2 — Experiências por CATEGORIA na janela
-- =============================================================
select
  e.categoria,
  count(distinct e.id) as experiencias,
  count(s.id) as slots
from public.experiences e
join public.experience_slots s on s.experience_id = e.id
where e.is_active is true
  and s.is_active is true
  and s.event_at >= '2026-05-25'::timestamp
  and s.event_at < '2026-06-25'::timestamp
  and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
group by e.categoria
order by experiencias desc;


-- =============================================================
-- Q3 — TODAS experiências de Bartenderia / Gastronomia / Pintura
--      mesmo SEM slot na janela — pra ver o universo completo
-- =============================================================
select
  e.id,
  e.nome,
  e.categoria,
  e.is_active,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id
      and s.event_at >= '2026-05-25'::timestamp
      and s.event_at < '2026-06-25'::timestamp
      and s.is_active is true) as slots_ativos_na_janela,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id
      and s.event_at >= '2026-05-25'::timestamp
      and s.event_at < '2026-06-25'::timestamp
      and s.is_active is false) as slots_inativos_na_janela,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id
      and s.event_at >= '2026-05-25'::timestamp
      and s.event_at < '2026-06-25'::timestamp
      and s.is_active is null) as slots_active_null_na_janela,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id
      and s.event_at >= '2026-05-25'::timestamp
      and s.event_at < '2026-06-25'::timestamp) as slots_total_na_janela
from public.experiences e
where e.is_active is true
  and (
    lower(e.categoria) like '%bartender%'
    or lower(e.categoria) like '%gastronom%'
    or lower(e.categoria) like '%pintura%'
    or lower(e.categoria) like '%vela%'
  )
order by e.categoria, e.nome;


-- =============================================================
-- Q4 — Experiências com slot na janela mas com problemas
--      (slot inativo / vagas zeradas / etc.)
-- =============================================================
select
  e.nome,
  e.categoria,
  s.data,
  s.horario,
  s.event_at,
  s.is_active as slot_active,
  s.vagas_total,
  s.vagas_restantes,
  case
    when s.is_active is false then 'slot inativo'
    when s.is_active is null then 'slot active NULL'
    when s.vagas_total is not null and s.vagas_restantes is not null and s.vagas_restantes <= 0 then 'esgotado'
    else 'OK'
  end as status
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where e.is_active is true
  and s.event_at >= '2026-05-25'::timestamp
  and s.event_at < '2026-06-25'::timestamp
  and (
    s.is_active is not true
    or (s.vagas_total is not null and s.vagas_restantes is not null and s.vagas_restantes <= 0)
  )
order by e.categoria, e.nome, s.event_at
limit 50;


-- =============================================================
-- Q5 — Quantas experiências o admin DEVERIA estar mostrando
--      (mesmo critério do JS: ativo, slot is_active=true,
--       vagas > 0 OU null)
-- =============================================================
with na_janela as (
  select distinct e.id
  from public.experiences e
  join public.experience_slots s on s.experience_id = e.id
  where e.is_active is true
    and s.is_active is true
    and s.event_at >= '2026-05-25'::timestamp
    and s.event_at < '2026-06-25'::timestamp
)
select count(*) as experiencias_que_deveriam_aparecer from na_janela;


-- =============================================================
-- Q6 — Lista as 30 mais próximas do 12/06 com slot ativo
-- =============================================================
select distinct on (e.nome)
  e.nome,
  e.categoria,
  s.data,
  s.horario,
  s.event_at,
  s.vagas_total,
  s.vagas_restantes
from public.experiences e
join public.experience_slots s on s.experience_id = e.id
where e.is_active is true
  and s.is_active is true
  and s.event_at >= '2026-05-25'::timestamp
  and s.event_at < '2026-06-25'::timestamp
  and (s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0)
order by e.nome, abs(extract(epoch from (s.event_at - '2026-06-12'::timestamp)))
limit 30;
