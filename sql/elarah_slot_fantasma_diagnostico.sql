-- =============================================================
-- ELARAH — Diagnóstico: "horário fantasma" (compra de horário que não existe)
-- -------------------------------------------------------------
-- CONTEXTO (bug reportado):
--   Cliente recebeu confirmação de "Pintura em Cerâmica" em 09/08 às
--   13h00 – 15h00, mas esse horário NÃO existe em nenhuma regra ativa —
--   as regras geram só 11h00–13h00 e 15h30–17h30. O "13h00 – 15h00" vinha
--   do campo LEGADO da experiência (experiences.horario / .horarios), que
--   ficou defasado e não corresponde a nenhum slot real.
--
--   O código já foi corrigido em duas frentes:
--     1. Servidor (booking_guard.ts + create-checkout-session): recusa a
--        compra quando o horário/slot enviado não bate com um slot ATIVO e
--        a experiência é gerenciada por slots (recorrência/manual).
--     2. Front (experiencia.html): não oferece mais o horário legado quando
--        a experiência tem slots — mostra "Sem datas disponíveis".
--
--   Este script é SÓ LEITURA. Serve pra:
--     • Ver a experiência de cerâmica, seu horário legado e seus slots reais.
--     • Achar reservas já feitas num horário fantasma (ex.: a da Ana Luisa).
--     • Varrer TODAS as experiências que ainda carregam horário legado
--       defasado (as próximas a dar o mesmo problema).
--
-- Como rodar: Supabase → SQL Editor → cola → Run. Nada é alterado.
-- =============================================================


-- =============================================================
-- Q1 — A experiência de cerâmica: campo legado x slots reais
-- =============================================================
select
  e.id,
  e.nome,
  e.is_active,
  e.horario                as horario_legado,      -- fonte do "13h00 – 15h00"
  e.horarios               as horarios_legado,
  e.horario_funcionamento  as agendamento_livre,   -- se preenchido, é voucher (ok não ter slot)
  (select count(*) from public.experience_slots s
     where s.experience_id = e.id and s.is_active is true)              as slots_ativos,
  (select count(*) from public.experience_recurrence_rules r
     where r.experience_id = e.id and r.is_active is true)             as regras_ativas
from public.experiences e
where lower(e.nome) like '%pintura%cer%mica%'
   or lower(e.nome) like '%cer%mica%'
order by e.nome;


-- =============================================================
-- Q2 — Slots REAIS da cerâmica (o que de fato pode ser comprado)
-- =============================================================
select
  s.data,
  s.horario,
  s.event_at,
  s.is_active,
  s.vagas_total,
  s.vagas_restantes,
  s.recurrence_rule_id
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where (lower(e.nome) like '%pintura%cer%mica%' or lower(e.nome) like '%cer%mica%')
order by s.event_at nulls last, s.horario;


-- =============================================================
-- Q3 — RESERVAS FANTASMA: bookings cujo horário não bate com
--      NENHUM slot ativo da experiência (e a experiência TEM slots).
--      É aqui que aparece a reserva da Ana Luisa (13h00 – 15h00).
-- -------------------------------------------------------------
-- Regra: experiência gerenciada por slots (tem >=1 slot ativo) E o
-- booking não aponta pra um slot ativo (slot_id nulo/ inativo/ ausente)
-- E o texto `horario` do booking não existe entre os horários ativos.
-- =============================================================
select
  b.id            as booking_id,
  b.nome,
  b.email,
  b.status,
  b.data          as booking_data,
  b.horario       as booking_horario,
  b.slot_id,
  e.id            as experiencia_id,
  e.nome          as experiencia_nome,
  b.created_at
from public.bookings b
join public.experiences e on e.id = b.experiencia_id
where b.status in ('pending', 'pago')
  -- experiência é gerenciada por slots
  and exists (
    select 1 from public.experience_slots s
     where s.experience_id = e.id and s.is_active is true
  )
  -- não é agendamento livre (voucher)
  and coalesce(nullif(trim(e.horario_funcionamento), ''), null) is null
  -- o booking NÃO está ancorado num slot ativo
  and not exists (
    select 1 from public.experience_slots s
     where s.id = b.slot_id and s.is_active is true
  )
  -- e o horário textual do booking não corresponde a nenhum slot ativo
  and not exists (
    select 1 from public.experience_slots s
     where s.experience_id = e.id
       and s.is_active is true
       and s.horario = b.horario
  )
order by b.created_at desc;


-- =============================================================
-- Q4 — VARREDURA GERAL: experiências gerenciadas por slots que ainda
--      carregam um horário LEGADO defasado (não bate com slot ativo).
--      São as próximas candidatas ao mesmo bug — candidatas a limpeza
--      do campo legado experiences.horario / .horarios.
-- =============================================================
select
  e.id,
  e.nome,
  e.horario   as horario_legado,
  e.horarios  as horarios_legado,
  (select count(*) from public.experience_slots s
     where s.experience_id = e.id and s.is_active is true) as slots_ativos
from public.experiences e
where e.is_active is true
  and coalesce(nullif(trim(e.horario_funcionamento), ''), null) is null
  -- tem slots ativos (é gerenciada por slots)
  and exists (
    select 1 from public.experience_slots s
     where s.experience_id = e.id and s.is_active is true
  )
  -- carrega horário legado
  and coalesce(nullif(trim(e.horario), ''), null) is not null
  -- e esse horário legado NÃO existe entre os slots ativos
  and not exists (
    select 1 from public.experience_slots s
     where s.experience_id = e.id
       and s.is_active is true
       and s.horario = e.horario
  )
order by e.nome;
