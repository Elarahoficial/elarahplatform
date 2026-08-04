-- =============================================================
-- ELARAH — Investigação: reserva 10h00 x site mostrando só 19h30
--          Pintura em Cerâmica (seg à sexta) — reserva de 11/08
-- -------------------------------------------------------------
-- SINTOMA
--   No site (experiencia.html) o dia 11/08 mostra apenas o horário
--   "19h30 – 21h30", mas existe uma reserva paga de 11/08 com
--   horário "10h00 – 12h00" (cliente Michelle Darlan).
--
-- HIPÓTESE (mecanismo conhecido — mesmo bug de slots divergentes)
--   A experiência tem regra de recorrência. Ela foi criada/editada
--   com "10h00 – 12h00"; a cliente reservou 11/08 nesse horário.
--   Depois o horário da regra mudou pra "19h30 – 21h30". A
--   re-materialização criou o slot novo de 19h30 pra 11/08, e o
--   slot antigo de 10h00 foi:
--     (a) preservado com a reserva mas escondido do site porque
--         está esgotado (vagas_restantes = 0), OU
--     (b) preservado e destacado da regra (recurrence_rule_id NULL,
--         vira "manual") mas esgotado, OU
--     (c) apagado — sobrando só o snapshot "10h00" gravado na
--         própria reserva (bookings.horario), que é imutável.
--   O site filtra slots com vagas_restantes > 0, então o 10h00
--   esgotado não aparece; o booking guarda o que foi comprado.
--
-- Este script é READ-ONLY (nenhum UPDATE/DELETE). Cola no SQL
-- Editor do Supabase e roda tudo. As 4 queries confirmam qual
-- dos cenários acima aconteceu.
-- =============================================================


-- =============================================================
-- Q1 — Acha a experiência "Pintura em Cerâmica (seg à sexta)"
-- =============================================================
select
  id,
  nome,
  categoria,
  is_active,
  event_at,
  data,
  horario
from public.experiences
where lower(nome) like '%pintura em cer%mica%'
order by nome;


-- =============================================================
-- Q2 — TODOS os slots dessa experiência em 11/08 (e dias vizinhos)
--      Revela se existem DOIS slots no mesmo dia (10h00 e 19h30),
--      com is_active, vagas e vínculo com a regra.
--      >>> Ajuste o intervalo de datas se precisar. <<<
-- =============================================================
select
  s.id as slot_id,
  e.nome,
  s.data,
  s.horario,
  s.event_at,
  s.is_active         as slot_active,
  s.vagas_total,
  s.vagas_restantes,
  s.recurrence_rule_id,
  case
    when s.recurrence_rule_id is null then 'manual/destacado'
    else 'gerado por regra'
  end                 as origem,
  case
    when s.vagas_restantes is not null and s.vagas_restantes <= 0
      then 'ESGOTADO — some do site'
    when s.is_active is false
      then 'INATIVO — some do site'
    else 'aparece no site'
  end                 as visibilidade_site
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where lower(e.nome) like '%pintura em cer%mica%'
  and s.event_at >= '2026-08-10'::timestamp
  and s.event_at <  '2026-08-13'::timestamp
order by s.event_at, s.horario;


-- =============================================================
-- Q3 — Regra de recorrência atual: qual horário ela materializa
--      HOJE? Comparar com o horário do slot da reserva mostra a
--      divergência (regra = 19h30, slot da reserva = 10h00).
-- =============================================================
select
  r.id as rule_id,
  e.nome,
  r.weekdays,
  r.hora_inicio,
  r.hora_fim,
  r.horario_label      as horario_atual_da_regra,
  r.is_active          as rule_active,
  (select count(*) from public.experience_slots s
     where s.recurrence_rule_id = r.id
       and s.horario <> r.horario_label) as slots_divergentes_da_regra
from public.experience_recurrence_rules r
join public.experiences e on e.id = r.experience_id
where lower(e.nome) like '%pintura em cer%mica%';


-- =============================================================
-- Q4 — A(s) reserva(s) de 11/08 e o slot que cada uma aponta.
--      Confirma que o horário "10h00" está gravado no booking
--      (snapshot da compra) e mostra o estado atual do slot_id
--      referenciado (existe? esgotado? destacado? apagado?).
-- =============================================================
select
  b.id as booking_id,
  b.created_at,
  b.nome,
  b.email,
  b.telefone,
  b.experiencia_nome,
  b.data               as data_reservada,
  b.horario            as horario_reservado,   -- << snapshot do que a cliente comprou
  b.quantidade,
  b.status,
  b.slot_id,
  s.id                 as slot_ainda_existe,
  s.horario            as slot_horario_atual,
  s.event_at           as slot_event_at,
  s.is_active          as slot_active,
  s.vagas_restantes    as slot_vagas_restantes,
  s.recurrence_rule_id as slot_regra
from public.bookings b
left join public.experience_slots s on s.id = b.slot_id
where lower(b.experiencia_nome) like '%pintura em cer%mica%'
  and (b.data in ('11/08', '11/08/2026') or b.horario like '10h%')
order by b.created_at desc;
