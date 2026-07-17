-- =============================================================
-- ELARAH — Tem experiência HOJE À NOITE? (17/07/2026)
-- -------------------------------------------------------------
-- Read-only. Nada é alterado — só consulta.
-- Fuso: America/Sao_Paulo (BRT). event_at é timestamptz, então
-- convertemos pro horário local antes de comparar a data/hora.
--
-- "À noite" = slots a partir das 17h (local) do dia 17/07.
-- Rode UMA query de cada vez no SQL Editor do Supabase.
-- =============================================================


-- =============================================================
-- Q1 — RESUMO: quantas experiências à noite hoje
-- =============================================================
select
  count(*)                        as slots_a_noite,
  count(distinct s.experience_id) as experiencias_a_noite,
  count(*) filter (
    where s.vagas_total is null or s.vagas_restantes is null or s.vagas_restantes > 0
  )                               as slots_com_vaga
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where coalesce(e.is_active, true) is true
  and coalesce(s.is_active, true) is true
  and (s.event_at at time zone 'America/Sao_Paulo')::date = date '2026-07-17'
  and extract(hour from (s.event_at at time zone 'America/Sao_Paulo')) >= 17;


-- =============================================================
-- Q2 — LISTA: o que tem à noite hoje (com vaga), a mais cedo primeiro
-- =============================================================
select
  e.nome,
  e.categoria,
  e.bairro,
  e.preco,
  s.data                                                    as data_rotulo,
  s.horario,
  to_char(s.event_at at time zone 'America/Sao_Paulo',
          'DD/MM HH24:MI')                                  as quando_brt,
  s.vagas_total,
  s.vagas_restantes,
  case
    when s.vagas_total is null or s.vagas_restantes is null then 'ilimitado'
    when s.vagas_restantes > 0 then s.vagas_restantes || ' vaga(s)'
    else 'ESGOTADO'
  end                                                       as situacao_vagas
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where coalesce(e.is_active, true) is true
  and coalesce(s.is_active, true) is true
  and (s.event_at at time zone 'America/Sao_Paulo')::date = date '2026-07-17'
  and extract(hour from (s.event_at at time zone 'America/Sao_Paulo')) >= 17
order by s.event_at, e.nome;


-- =============================================================
-- Q3 — FALLBACK: o dia INTEIRO 17/07 (caso a noite venha vazia)
--      inclui esgotados/inativos pra você enxergar tudo
-- =============================================================
select
  e.nome,
  e.categoria,
  e.bairro,
  s.data                                                    as data_rotulo,
  s.horario,
  to_char(s.event_at at time zone 'America/Sao_Paulo',
          'DD/MM HH24:MI')                                  as quando_brt,
  coalesce(e.is_active, true)                               as exp_ativa,
  coalesce(s.is_active, true)                               as slot_ativo,
  s.vagas_total,
  s.vagas_restantes
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where (s.event_at at time zone 'America/Sao_Paulo')::date = date '2026-07-17'
order by s.event_at, e.nome;
