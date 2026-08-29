-- =============================================================
-- ELARAH — Oficinas de HOJE
-- -------------------------------------------------------------
-- Só CONSULTA. Não altera nada. Pode rodar quantas vezes quiser
-- no SQL Editor do Supabase.
--
-- "Hoje" = dia corrente em America/Sao_Paulo (não em UTC).
-- O event_at dos slots é timestamptz, então convertemos antes
-- de comparar — do contrário as oficinas da noite (18h+ BRT)
-- cairiam no dia seguinte em UTC.
--
-- Dependências: experiences, experience_slots, bookings,
--               manual_sales, fornecedores_metadata.
--
-- Obs.: o WhatsApp do fornecedor NÃO fica em experiences — a
-- migração elarah_fornecedores_whatsapp.sql centralizou tudo em
-- fornecedores_metadata.whatsapp, ligado por fornecedor_key
-- (nome em minúsculas, espaços colapsados). Por isso o join.
-- =============================================================


-- =============================================================
-- 1) AGENDA DO DIA — uma linha por oficina/horário de hoje
-- =============================================================
with hoje as (
  select (now() at time zone 'America/Sao_Paulo')::date as d
),
slots_hoje as (
  select
    s.id            as slot_id,
    s.experience_id,
    s.data          as data_label,
    s.horario,
    s.event_at,
    s.vagas_total,
    s.vagas_restantes
  from public.experience_slots s
  cross join hoje h
  where s.is_active
    and s.event_at is not null
    and (s.event_at at time zone 'America/Sao_Paulo')::date = h.d
),
reservas as (
  -- Reservas do site (Stripe / Mercado Pago) já pagas ou pendentes
  select
    b.slot_id,
    count(*) filter (where b.status = 'pago')                     as reservas_pagas,
    coalesce(sum(b.quantidade) filter (where b.status = 'pago'), 0) as pessoas_pagas,
    count(*) filter (where b.status = 'pending')                  as reservas_pendentes
  from public.bookings b
  where b.slot_id is not null
    and b.status in ('pago', 'pending')
  group by b.slot_id
),
vendas_manuais as (
  -- Vendas registradas na mão (WhatsApp, Instagram, presencial...)
  select
    ms.slot_id,
    count(*)                        as vendas_manuais,
    coalesce(sum(ms.quantity), 0)   as pessoas_manuais
  from public.manual_sales ms
  where ms.slot_id is not null
    and ms.payment_status = 'pago'
  group by ms.slot_id
)
select
  to_char(sh.event_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') as data,
  to_char(sh.event_at at time zone 'America/Sao_Paulo', 'HH24:MI')    as hora,
  sh.horario                                as horario_label,
  e.nome                                    as oficina,
  e.categoria,
  e.bairro,
  e.endereco,
  e.duracao,
  coalesce(e.fornecedor_nome, '—')          as fornecedor,
  coalesce(fm.whatsapp, '—')                as whatsapp_fornecedor,
  -- Ocupação
  coalesce(r.pessoas_pagas, 0) + coalesce(vm.pessoas_manuais, 0) as pessoas_confirmadas,
  coalesce(r.reservas_pendentes, 0)         as reservas_pendentes,
  sh.vagas_total,
  sh.vagas_restantes,
  case
    when sh.vagas_total is null then 'ilimitado'
    when coalesce(sh.vagas_restantes, 0) = 0 then 'ESGOTADO'
    else sh.vagas_restantes || ' vaga(s) livre(s)'
  end                                       as ocupacao,
  sh.slot_id,
  e.id                                      as experience_id
from slots_hoje sh
join public.experiences e on e.id = sh.experience_id
left join reservas r        on r.slot_id = sh.slot_id
left join vendas_manuais vm on vm.slot_id = sh.slot_id
left join public.fornecedores_metadata fm
       on fm.fornecedor_key = lower(trim(regexp_replace(e.fornecedor_nome, '\s+', ' ', 'g')))
where coalesce(e.is_active, true)
order by sh.event_at asc, e.nome asc;


-- =============================================================
-- 2) LISTA DE PRESENÇA — quem vai em cada oficina de hoje
-- -------------------------------------------------------------
-- Junta reservas do site + vendas manuais numa lista só.
-- =============================================================
with hoje as (
  select (now() at time zone 'America/Sao_Paulo')::date as d
),
slots_hoje as (
  select s.id as slot_id, s.experience_id, s.event_at, s.horario
  from public.experience_slots s
  cross join hoje h
  where s.is_active
    and s.event_at is not null
    and (s.event_at at time zone 'America/Sao_Paulo')::date = h.d
)
select * from (
  -- Reservas do site
  select
    to_char(sh.event_at at time zone 'America/Sao_Paulo', 'HH24:MI') as hora,
    e.nome                as oficina,
    'site'                as origem,
    b.nome                as cliente,
    b.email,
    b.telefone,
    b.quantidade          as pessoas,
    b.status              as status,
    b.acompanhantes,
    sh.event_at
  from slots_hoje sh
  join public.experiences e on e.id = sh.experience_id
  join public.bookings b    on b.slot_id = sh.slot_id
  where b.status in ('pago', 'pending')

  union all

  -- Vendas manuais
  select
    to_char(sh.event_at at time zone 'America/Sao_Paulo', 'HH24:MI') as hora,
    e.nome                as oficina,
    'manual'              as origem,
    ms.customer_name      as cliente,
    ms.customer_email     as email,
    ms.customer_phone     as telefone,
    ms.quantity           as pessoas,
    ms.payment_status     as status,
    '[]'::jsonb           as acompanhantes,
    sh.event_at
  from slots_hoje sh
  join public.experiences e   on e.id = sh.experience_id
  join public.manual_sales ms on ms.slot_id = sh.slot_id
  where ms.payment_status in ('pago', 'pendente')
) lista
order by event_at asc, oficina asc, cliente asc;


-- =============================================================
-- 3) REDE DE SEGURANÇA — slots sem event_at preenchido
-- -------------------------------------------------------------
-- Alguns slots antigos guardam só o rótulo textual ("29/08" ou
-- "29/08/2026") e ficam com event_at NULL — esses NÃO aparecem
-- nas consultas acima. Esta query pesca esses casos pelo texto.
-- Se vier vazio, está tudo certo.
-- =============================================================
select
  s.data           as data_label,
  s.horario,
  e.nome           as oficina,
  e.categoria,
  e.bairro,
  coalesce(e.fornecedor_nome, '—') as fornecedor,
  coalesce(fm.whatsapp, '—')       as whatsapp_fornecedor,
  s.vagas_total,
  s.vagas_restantes,
  s.id             as slot_id
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
left join public.fornecedores_metadata fm
       on fm.fornecedor_key = lower(trim(regexp_replace(e.fornecedor_nome, '\s+', ' ', 'g')))
cross join lateral (select (now() at time zone 'America/Sao_Paulo')::date as d) h
where s.is_active
  and s.event_at is null
  and s.data is not null
  and (
        s.data = to_char(h.d, 'DD/MM')
     or s.data = to_char(h.d, 'DD/MM/YYYY')
     or s.data = to_char(h.d, 'FMDD/FMMM')
  )
order by e.nome asc;


-- =============================================================
-- 4) VARIAÇÕES ÚTEIS
-- -------------------------------------------------------------
-- Troque o filtro da CTE `hoje` da query 1 conforme precisar:
--
--   Amanhã:
--     select ((now() at time zone 'America/Sao_Paulo')::date + 1) as d
--
--   Data específica:
--     select date '2026-09-15' as d
--
--   Semana inteira (troque o `=` por BETWEEN na slots_hoje):
--     and (s.event_at at time zone 'America/Sao_Paulo')::date
--         between h.d and h.d + 6
--
--   Só uma categoria (ex.: cerâmica) — adicione no WHERE final:
--     and e.categoria ilike '%ceramica%'
-- =============================================================
