-- =============================================================
-- ELARAH — TAXA DE RECORRÊNCIA (repeat rate) de clientes
-- -------------------------------------------------------------
-- READ-ONLY (só a Q7, comentada, escreve). Pode rodar em produção.
--
-- POR QUE ESSE ARQUIVO EXISTE
--   O KPI 'repeat-rate' ("% de clientes que voltam a reservar em
--   90 dias", meta 25%) existe em public.growth_kpis, mas o valor
--   é preenchido À MÃO e está zerado. Nada no site, no painel ou
--   nas Edge Functions calcula recorrência hoje.
--
-- O QUE CONTA COMO "COMPRA"  ← LEIA ANTES DE USAR O NÚMERO
--   Uma linha em bookings NÃO é uma compra. Um checkout com duas
--   experiências (ou duas vagas lançadas separadas) vira 2, 3, 4
--   bookings do mesmo cliente no mesmo dia. Contar linhas infla a
--   recorrência: metade dos "recorrentes" do primeiro levantamento
--   tinha primeira_compra = ultima_compra, ou seja, comprou UMA vez.
--
--   Por isso a definição oficial aqui é DIA DE COMPRA DISTINTO
--   (fuso America/Sao_Paulo): o cliente é recorrente quando voltou
--   em OUTRO dia. Todas as queries devolvem as duas contas lado a
--   lado — taxa_bruta (linhas, inflada) e taxa_real (dias) — pra
--   diferença ficar visível em vez de escondida.
--
-- FONTES
--   • public.bookings      status = 'pago'          (site)
--   • public.manual_sales  payment_status = 'pago'  (WhatsApp,
--                                                    Instagram,
--                                                    presencial)
--   Cliente = E-MAIL normalizado (lower+trim): manual_sales não tem
--   user_id e o checkout aceita compra sem conta. Venda manual sem
--   e-mail fica de fora (Q0 mede quanto isso é).
--
-- COMO USAR
--   Rode bloco a bloco no SQL Editor do Supabase. Q1 = resposta
--   curta. Q2 = definição do KPI de growth (janela de 90 dias).
-- =============================================================


-- =============================================================
-- Q0. COBERTURA — quanto da base dá pra medir?
-- -------------------------------------------------------------
-- Vendas manuais sem e-mail não são atribuíveis a ninguém. Se
-- "sem_email" for alto, a taxa real é MAIOR que a medida.
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
-- taxa_real_pct   → % de clientes que compraram em 2+ DIAS
--                   diferentes. É a taxa de recorrência da Elarah.
-- taxa_bruta_pct  → % com 2+ linhas de venda (conta ingênua, infla
--                   por causa de checkout multi-item). Está aqui só
--                   pra comparação — não divulgue esse número.
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
  select cliente,
         count(*)                                                                as linhas,
         count(distinct (created_at at time zone 'America/Sao_Paulo')::date)     as dias
    from compras
   group by cliente
)
select
  count(*)                                                              as clientes_unicos,
  count(*) filter (where dias >= 2)                                     as recorrentes_reais,
  round(100.0 * count(*) filter (where dias >= 2) / nullif(count(*), 0), 1)
                                                                        as taxa_real_pct,
  count(*) filter (where linhas >= 2)                                   as recorrentes_brutos,
  round(100.0 * count(*) filter (where linhas >= 2) / nullif(count(*), 0), 1)
                                                                        as taxa_bruta_pct,
  round(avg(dias)::numeric, 2)                                          as dias_de_compra_por_cliente,
  round(avg(linhas)::numeric, 2)                                        as linhas_por_cliente,
  sum(linhas)                                                           as linhas_totais
from por_cliente;


-- =============================================================
-- Q2. REPEAT RATE 90 DIAS (definição do KPI de growth)
-- -------------------------------------------------------------
-- Só entra quem já teve TEMPO de voltar: clientes cujo 1º dia de
-- compra foi há 90 dias ou mais (coorte fechada). Dentre eles,
-- quantos compraram em OUTRO dia dentro dos 90 dias seguintes.
-- É esse número que vai pro growth_kpis.repeat-rate (meta 25%).
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
dias as (
  select distinct cliente,
         (created_at at time zone 'America/Sao_Paulo')::date as dia
    from compras
),
primeira as (
  select cliente, min(dia) as primeiro_dia from dias group by cliente
),
coorte as (
  select cliente, primeiro_dia
    from primeira
   where primeiro_dia <= (now() at time zone 'America/Sao_Paulo')::date - 90
),
voltou as (
  select c.cliente,
         exists (
           select 1 from dias d
            where d.cliente = c.cliente
              and d.dia >  c.primeiro_dia
              and d.dia <= c.primeiro_dia + 90
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
-- Q3. DISTRIBUIÇÃO — clientes por nº de DIAS de compra
-- -------------------------------------------------------------
-- Mostra se a recorrência é "muita gente voltando uma vez" ou
-- "pouca gente voltando muitas vezes".
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
  select cliente,
         count(distinct (created_at at time zone 'America/Sao_Paulo')::date) as dias
    from compras group by cliente
)
select
  case when dias >= 4 then '4+' else dias::text end                as faixa_dias_de_compra,
  count(*)                                                         as clientes,
  round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 1)     as pct_da_base
from por_cliente
group by 1
order by min(dias);


-- =============================================================
-- Q4. TEMPO ATÉ A 2ª COMPRA
-- -------------------------------------------------------------
-- Dias entre o 1º e o 2º DIA de compra de quem voltou. Calibra
-- quando disparar follow-up / cupom de fidelidade
-- (elarah_loyalty_card.sql).
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
dias as (
  select distinct cliente,
         (created_at at time zone 'America/Sao_Paulo')::date as dia
    from compras
),
ordenados as (
  select cliente, dia, row_number() over (partition by cliente order by dia) as n
    from dias
),
gap as (
  select p.cliente, (s.dia - p.dia) as dias_ate_2a
    from ordenados p
    join ordenados s on s.cliente = p.cliente and s.n = 2
   where p.n = 1
)
select
  count(*)                                                       as clientes_que_voltaram,
  round(avg(dias_ate_2a)::numeric, 1)                            as media_dias,
  round((percentile_cont(0.5) within group (order by dias_ate_2a))::numeric, 1)
                                                                 as mediana_dias,
  min(dias_ate_2a)                                               as min_dias,
  max(dias_ate_2a)                                               as max_dias,
  count(*) filter (where dias_ate_2a <= 30)                      as voltaram_ate_30d,
  count(*) filter (where dias_ate_2a <= 90)                       as voltaram_ate_90d
from gap;


-- =============================================================
-- Q5. RECORRÊNCIA POR COORTE MENSAL
-- -------------------------------------------------------------
-- Agrupa os clientes pelo mês da 1ª compra e mostra quantos
-- voltaram (em outro dia) e quantos voltaram em 90 dias. Coortes
-- com menos de 90 dias ainda estão "abertas" — coorte_fechada
-- avisa; comparar coorte aberta com fechada engana.
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
dias as (
  select distinct cliente,
         (created_at at time zone 'America/Sao_Paulo')::date as dia
    from compras
),
primeira as (
  select cliente, min(dia) as primeiro_dia from dias group by cliente
),
flags as (
  select p.cliente,
         date_trunc('month', p.primeiro_dia)::date as mes_coorte,
         p.primeiro_dia <= (now() at time zone 'America/Sao_Paulo')::date - 90 as coorte_fechada,
         exists (select 1 from dias d
                  where d.cliente = p.cliente and d.dia > p.primeiro_dia) as voltou,
         exists (select 1 from dias d
                  where d.cliente = p.cliente
                    and d.dia >  p.primeiro_dia
                    and d.dia <= p.primeiro_dia + 90) as voltou_90d
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
-- Q6. TOP CLIENTES RECORRENTES (recorrência REAL)
-- -------------------------------------------------------------
-- Só quem voltou em OUTRO dia. dias_de_compra é a recorrência de
-- verdade; linhas mostra quantas reservas isso gerou (linhas >
-- dias = checkout multi-item). Lista curta pra tratar com carinho.
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
  cliente                                                             as email,
  max(nullif(nome, ''))                                               as nome,
  count(distinct (created_at at time zone 'America/Sao_Paulo')::date)  as dias_de_compra,
  count(*)                                                            as linhas,
  round(sum(valor) / 100.0, 2)                                        as total_gasto_reais,
  (min(created_at) at time zone 'America/Sao_Paulo')::date            as primeira_compra,
  (max(created_at) at time zone 'America/Sao_Paulo')::date            as ultima_compra
from compras
group by cliente
having count(distinct (created_at at time zone 'America/Sao_Paulo')::date) >= 2
order by dias_de_compra desc, total_gasto_reais desc
limit 50;


-- =============================================================
-- Q7. (OPCIONAL) Gravar o resultado da Q2 no KPI de growth.
-- -------------------------------------------------------------
-- NÃO é read-only. Rode só depois de conferir a Q2, trocando o
-- 0.0 pelo valor de repeat_rate_90d_pct que ela devolveu.
-- =============================================================
-- update public.growth_kpis
--    set valor_atual = 0.0,
--        observacao  = '% de clientes que voltam a reservar (em outro dia) '
--                      || 'em 90 dias. Medido em ' || to_char(now(), 'DD/MM/YYYY')
--                      || ' via sql/elarah_taxa_recorrencia.sql (Q2).'
--  where slug = 'repeat-rate';
