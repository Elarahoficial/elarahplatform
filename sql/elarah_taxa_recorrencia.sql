-- =============================================================
-- ELARAH — TAXA DE RECORRÊNCIA (repeat rate) de clientes
-- -------------------------------------------------------------
-- READ-ONLY. Nenhuma query muda dados. Pode rodar em produção.
--
-- POR QUE ESSE ARQUIVO EXISTE
--   O KPI 'repeat-rate' ("% de clientes que voltam a reservar em
--   90 dias", meta 25%) existe em public.growth_kpis, mas o valor
--   é preenchido À MÃO e está zerado. Nada no site, no painel ou
--   nas Edge Functions calcula recorrência hoje. Estas queries
--   dão o número REAL a partir das vendas.
--
-- O QUE CONTA COMO "COMPRA"
--   • public.bookings      com status = 'pago'          (site)
--   • public.manual_sales  com payment_status = 'pago'  (WhatsApp,
--                                                        Instagram,
--                                                        presencial)
--   O cliente é identificado pelo E-MAIL normalizado (lower+trim),
--   porque manual_sales não tem user_id e o checkout do site aceita
--   compra sem conta. Vendas manuais SEM e-mail não entram (não dá
--   pra saber se são a mesma pessoa) — a Q0 mostra quantas são.
--
-- COMO USAR
--   Rode bloco a bloco no SQL Editor do Supabase. A Q1 é a resposta
--   curta ("qual a taxa de recorrência?"); a Q2 é a que casa com a
--   definição do KPI de growth (janela de 90 dias).
-- =============================================================


-- =============================================================
-- BASE — view temporária de compras unificadas.
-- Rode este bloco JUNTO com a query que vier depois (o CTE é
-- repetido em cada query pra cada bloco ser autossuficiente).
-- =============================================================


-- =============================================================
-- Q0. COBERTURA — quanto da base dá pra medir?
-- -------------------------------------------------------------
-- Vendas manuais sem e-mail ficam de fora da conta. Se o número
-- de "sem_email" for alto, a taxa real é maior que a medida.
-- =============================================================
select
  (select count(*) from public.bookings where status = 'pago')                            as bookings_pagos,
  (select count(*) from public.bookings where status = 'pago'
     and coalesce(nullif(btrim(email), ''), '') = '')                                     as bookings_sem_email,
  (select count(*) from public.manual_sales where payment_status = 'pago')                as vendas_manuais_pagas,
  (select count(*) from public.manual_sales where payment_status = 'pago'
     and coalesce(nullif(btrim(customer_email), ''), '') = '')                            as vendas_manuais_sem_email;


-- =============================================================
-- Q1. TAXA DE RECORRÊNCIA GERAL (all-time)
-- -------------------------------------------------------------
-- % de clientes identificados que compraram 2x ou mais, em toda
-- a história da Elarah. É o número de resposta rápida.
-- =============================================================
with compras as (
  select lower(btrim(email)) as cliente, created_at
    from public.bookings
   where status = 'pago' and coalesce(nullif(btrim(email), ''), '') <> ''
  union all
  select lower(btrim(customer_email)) as cliente, created_at
    from public.manual_sales
   where payment_status = 'pago' and coalesce(nullif(btrim(customer_email), ''), '') <> ''
),
por_cliente as (
  select cliente, count(*) as compras, min(created_at) as primeira, max(created_at) as ultima
    from compras group by cliente
)
select
  count(*)                                                            as clientes_unicos,
  count(*) filter (where compras >= 2)                                as clientes_recorrentes,
  round(100.0 * count(*) filter (where compras >= 2) / nullif(count(*), 0), 1)
                                                                      as taxa_recorrencia_pct,
  round(avg(compras)::numeric, 2)                                     as compras_por_cliente,
  sum(compras)                                                        as compras_totais
from por_cliente;


-- =============================================================
-- Q2. REPEAT RATE 90 DIAS (definição do KPI de growth)
-- -------------------------------------------------------------
-- Só entra na conta quem já teve TEMPO de voltar: clientes cuja
-- 1ª compra aconteceu há 90 dias ou mais (coorte fechada). Dentre
-- eles, quantos compraram de novo até 90 dias depois da primeira.
-- É esse número que deve ir pro growth_kpis.repeat-rate (meta 25%).
-- =============================================================
with compras as (
  select lower(btrim(email)) as cliente, created_at
    from public.bookings
   where status = 'pago' and coalesce(nullif(btrim(email), ''), '') <> ''
  union all
  select lower(btrim(customer_email)) as cliente, created_at
    from public.manual_sales
   where payment_status = 'pago' and coalesce(nullif(btrim(customer_email), ''), '') <> ''
),
primeira as (
  select cliente, min(created_at) as primeira_compra
    from compras group by cliente
),
coorte as (
  select p.cliente, p.primeira_compra
    from primeira p
   where p.primeira_compra <= now() - interval '90 days'
),
voltou as (
  select c.cliente,
         exists (
           select 1 from compras x
            where x.cliente = c.cliente
              and x.created_at >  c.primeira_compra
              and x.created_at <= c.primeira_compra + interval '90 days'
         ) as voltou_90d
    from coorte c
)
select
  count(*)                                                        as clientes_na_coorte,
  count(*) filter (where voltou_90d)                              as voltaram_em_90d,
  round(100.0 * count(*) filter (where voltou_90d) / nullif(count(*), 0), 1)
                                                                  as repeat_rate_90d_pct,
  25                                                              as meta_kpi_pct
from voltou;


-- =============================================================
-- Q3. DISTRIBUIÇÃO — quantos clientes compraram 1x, 2x, 3x, 4x+
-- -------------------------------------------------------------
-- Mostra se a recorrência é "muita gente voltando uma vez" ou
-- "pouca gente voltando muitas vezes".
-- =============================================================
with compras as (
  select lower(btrim(email)) as cliente
    from public.bookings
   where status = 'pago' and coalesce(nullif(btrim(email), ''), '') <> ''
  union all
  select lower(btrim(customer_email)) as cliente
    from public.manual_sales
   where payment_status = 'pago' and coalesce(nullif(btrim(customer_email), ''), '') <> ''
),
por_cliente as (
  select cliente, count(*) as compras from compras group by cliente
)
select
  case when compras >= 4 then '4+' else compras::text end          as faixa_compras,
  count(*)                                                         as clientes,
  round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 1)     as pct_da_base
from por_cliente
group by 1
order by min(compras);


-- =============================================================
-- Q4. TEMPO ATÉ A 2ª COMPRA
-- -------------------------------------------------------------
-- Mediana e média de dias entre a 1ª e a 2ª compra de quem voltou.
-- Serve pra calibrar quando disparar o follow-up / cupom de
-- fidelidade (elarah_loyalty_card.sql).
-- =============================================================
with compras as (
  select lower(btrim(email)) as cliente, created_at
    from public.bookings
   where status = 'pago' and coalesce(nullif(btrim(email), ''), '') <> ''
  union all
  select lower(btrim(customer_email)) as cliente, created_at
    from public.manual_sales
   where payment_status = 'pago' and coalesce(nullif(btrim(customer_email), ''), '') <> ''
),
ordenadas as (
  select cliente, created_at,
         row_number() over (partition by cliente order by created_at) as n
    from compras
),
gap as (
  select p.cliente,
         extract(epoch from (s.created_at - p.created_at)) / 86400.0 as dias_ate_2a
    from ordenadas p
    join ordenadas s on s.cliente = p.cliente and s.n = 2
   where p.n = 1
)
select
  count(*)                                                       as clientes_que_voltaram,
  round(avg(dias_ate_2a)::numeric, 1)                            as media_dias,
  round((percentile_cont(0.5) within group (order by dias_ate_2a))::numeric, 1)
                                                                 as mediana_dias,
  round(min(dias_ate_2a)::numeric, 1)                            as min_dias,
  round(max(dias_ate_2a)::numeric, 1)                            as max_dias
from gap;


-- =============================================================
-- Q5. RECORRÊNCIA POR COORTE MENSAL
-- -------------------------------------------------------------
-- Agrupa os clientes pelo mês da 1ª compra e mostra quantos
-- voltaram (a qualquer momento) e quantos voltaram em 90 dias.
-- Coortes com menos de 90 dias ainda estão "abertas" — a coluna
-- coorte_fechada avisa.
-- =============================================================
with compras as (
  select lower(btrim(email)) as cliente, created_at
    from public.bookings
   where status = 'pago' and coalesce(nullif(btrim(email), ''), '') <> ''
  union all
  select lower(btrim(customer_email)) as cliente, created_at
    from public.manual_sales
   where payment_status = 'pago' and coalesce(nullif(btrim(customer_email), ''), '') <> ''
),
primeira as (
  select cliente, min(created_at) as primeira_compra
    from compras group by cliente
),
flags as (
  select p.cliente,
         date_trunc('month', p.primeira_compra) as mes_coorte,
         p.primeira_compra <= now() - interval '90 days' as coorte_fechada,
         exists (select 1 from compras x
                  where x.cliente = p.cliente and x.created_at > p.primeira_compra) as voltou,
         exists (select 1 from compras x
                  where x.cliente = p.cliente
                    and x.created_at >  p.primeira_compra
                    and x.created_at <= p.primeira_compra + interval '90 days') as voltou_90d
    from primeira p
)
select
  to_char(mes_coorte, 'YYYY-MM')                                        as mes_primeira_compra,
  bool_and(coorte_fechada)                                              as coorte_fechada,
  count(*)                                                              as clientes_novos,
  count(*) filter (where voltou)                                        as voltaram_alguma_vez,
  round(100.0 * count(*) filter (where voltou) / nullif(count(*), 0), 1) as pct_voltaram,
  count(*) filter (where voltou_90d)                                    as voltaram_90d,
  round(100.0 * count(*) filter (where voltou_90d) / nullif(count(*), 0), 1) as pct_90d
from flags
group by mes_coorte
order by mes_coorte;


-- =============================================================
-- Q6. TOP CLIENTES RECORRENTES
-- -------------------------------------------------------------
-- Quem mais volta, com quanto já gastou. Lista curta pra tratar
-- com carinho (mensagem, brinde, convite pra clube).
-- =============================================================
with compras as (
  select lower(btrim(email)) as cliente, coalesce(nome, '') as nome,
         created_at, coalesce(amount_total, 0) as valor
    from public.bookings
   where status = 'pago' and coalesce(nullif(btrim(email), ''), '') <> ''
  union all
  select lower(btrim(customer_email)) as cliente, coalesce(customer_name, '') as nome,
         created_at, coalesce(total_amount_centavos, 0) as valor
    from public.manual_sales
   where payment_status = 'pago' and coalesce(nullif(btrim(customer_email), ''), '') <> ''
)
select
  cliente                                        as email,
  max(nullif(nome, ''))                          as nome,
  count(*)                                       as compras,
  round(sum(valor) / 100.0, 2)                   as total_gasto_reais,
  min(created_at)::date                          as primeira_compra,
  max(created_at)::date                          as ultima_compra
from compras
group by cliente
having count(*) >= 2
order by compras desc, total_gasto_reais desc
limit 50;


-- =============================================================
-- Q7. (OPCIONAL) Gravar o resultado da Q2 no KPI de growth.
-- -------------------------------------------------------------
-- NÃO é read-only. Rode só depois de conferir a Q2, trocando o
-- 0.0 pelo valor de repeat_rate_90d_pct que ela devolveu.
-- =============================================================
-- update public.growth_kpis
--    set valor_atual = 0.0,
--        observacao  = '% de clientes que voltam a reservar em 90 dias. '
--                      || 'Medido em ' || to_char(now(), 'DD/MM/YYYY')
--                      || ' via sql/elarah_taxa_recorrencia.sql (Q2).'
--  where slug = 'repeat-rate';
