-- =============================================================
-- ELARAH — Taxa de recompra (queries de análise)
-- -------------------------------------------------------------
-- A plataforma NÃO calcula taxa de recompra em lugar nenhum hoje.
-- O que existe é o bloco "Clientes" do Analytics (admin.js →
-- renderCustomers), que mostra "Clientes recorrentes" DENTRO de um
-- período — coisa diferente: é retenção da janela, não recompra
-- da base inteira.
--
-- Este arquivo responde de fato "qual a taxa de recompra?".
-- SOMENTE LEITURA — nenhum bloco altera dados. Pode rodar quantas
-- vezes quiser. Como rodar: Supabase Dashboard → SQL Editor →
-- cola o bloco que interessa → Run.
--
-- Fonte: public.v_financial_ledger (view unificada já usada pela
-- Contabilidade e pelo Analytics). Ela junta as TRÊS fontes de
-- receita — bookings do site, manual_sales (WhatsApp/Pix/presencial)
-- e gift_cards — com status normalizado e flag is_test. Contar só
-- bookings subestimaria a recompra, porque muita 2ª compra acontece
-- por WhatsApp.
--
-- Definições usadas aqui:
--   * Cliente  = e-mail normalizado (lower + trim). Compras sem
--                e-mail ficam de fora — não dá pra saber se é a
--                mesma pessoa.
--   * Compra   = 1 linha paga no ledger (1 checkout / 1 venda
--                manual / 1 gift card), independente da quantidade
--                de vagas.
--   * Recompra = cliente com 2+ compras.
--
-- Fuso: o SQL Editor do Supabase roda em UTC. Toda data exibida
-- aqui é convertida pra America/Sao_Paulo, senão uma venda das 22h
-- aparece como do dia seguinte.
--
-- Se a view v_financial_ledger não existir ainda, rode antes:
--   sql/elarah_contadores_por_quantidade.sql
-- =============================================================


-- =============================================================
-- BLOCO 1 — A RESPOSTA: taxa de recompra geral (vida toda)
-- =============================================================
with compras as (
  select
    lower(trim(customer_email))          as cliente,
    occurred_at,
    (occurred_at at time zone 'America/Sao_Paulo')::date as dia
  from public.v_financial_ledger
  where kind = 'income'
    and status = 'pago'
    and coalesce(is_test, false) = false
    and nullif(trim(customer_email), '') is not null
),
por_cliente as (
  select
    cliente,
    count(*)                as compras,
    count(distinct dia)     as dias_distintos
  from compras
  group by cliente
)
select
  count(*)                                                          as clientes_totais,
  count(*) filter (where compras >= 2)                              as clientes_com_recompra,
  round(100.0 * count(*) filter (where compras >= 2)
        / nullif(count(*), 0), 1)                                   as taxa_recompra_pct,
  -- Versão conservadora: 2 compras no MESMO dia (ex.: cliente fechou
  -- duas experiências no mesmo checkout em abas separadas) não conta
  -- como recompra. É o número mais honesto pra apresentar.
  count(*) filter (where dias_distintos >= 2)                       as clientes_com_recompra_dias_distintos,
  round(100.0 * count(*) filter (where dias_distintos >= 2)
        / nullif(count(*), 0), 1)                                   as taxa_recompra_dias_distintos_pct,
  round(avg(compras), 2)                                            as compras_por_cliente
from por_cliente;


-- =============================================================
-- BLOCO 2 — Distribuição: quantos compraram 1x, 2x, 3x, 4x+
-- Serve pra saber se a recompra vem de muita gente voltando uma vez
-- ou de um punhado de clientes fiéis puxando a média.
-- =============================================================
with compras as (
  select lower(trim(customer_email)) as cliente
  from public.v_financial_ledger
  where kind = 'income' and status = 'pago'
    and coalesce(is_test, false) = false
    and nullif(trim(customer_email), '') is not null
),
por_cliente as (
  select cliente, count(*) as compras from compras group by cliente
)
select
  case
    when compras = 1 then '1 compra'
    when compras = 2 then '2 compras'
    when compras = 3 then '3 compras'
    else '4+ compras'
  end                                                    as faixa,
  count(*)                                               as clientes,
  round(100.0 * count(*) / sum(count(*)) over (), 1)     as pct_da_base,
  sum(compras)                                           as compras_na_faixa
from por_cliente
group by faixa
order by min(compras);


-- =============================================================
-- BLOCO 3 — Taxa de recompra por fonte da PRIMEIRA compra
-- Responde: quem entra pelo site volta mais que quem entra por
-- WhatsApp/manual? É o que diz onde investir aquisição.
-- =============================================================
with compras as (
  select
    lower(trim(customer_email)) as cliente,
    source,
    occurred_at
  from public.v_financial_ledger
  where kind = 'income' and status = 'pago'
    and coalesce(is_test, false) = false
    and nullif(trim(customer_email), '') is not null
),
primeira as (
  select distinct on (cliente)
    cliente, source as fonte_entrada
  from compras
  order by cliente, occurred_at asc
),
totais as (
  select cliente, count(*) as compras from compras group by cliente
)
select
  p.fonte_entrada,
  count(*)                                                       as clientes,
  count(*) filter (where t.compras >= 2)                         as com_recompra,
  round(100.0 * count(*) filter (where t.compras >= 2)
        / nullif(count(*), 0), 1)                                as taxa_recompra_pct
from primeira p
join totais t on t.cliente = p.cliente
group by p.fonte_entrada
order by clientes desc;


-- =============================================================
-- BLOCO 4 — Recompra por coorte (mês da 1ª compra) com janelas
-- A taxa "vida toda" penaliza quem comprou mês passado (ainda não
-- teve tempo de voltar). Aqui cada coorte é medida em janelas
-- fixas de 90 e 180 dias — comparação justa entre meses.
-- =============================================================
with compras as (
  select
    lower(trim(customer_email)) as cliente,
    occurred_at
  from public.v_financial_ledger
  where kind = 'income' and status = 'pago'
    and coalesce(is_test, false) = false
    and nullif(trim(customer_email), '') is not null
),
primeira as (
  select cliente, min(occurred_at) as primeira_compra
  from compras group by cliente
),
recompras as (
  select
    p.cliente,
    p.primeira_compra,
    min(c.occurred_at) filter (where c.occurred_at > p.primeira_compra) as segunda_compra
  from primeira p
  join compras c on c.cliente = p.cliente
  group by p.cliente, p.primeira_compra
)
select
  to_char(date_trunc('month', primeira_compra at time zone 'America/Sao_Paulo'), 'YYYY-MM') as coorte,
  count(*)                                                             as novos_clientes,
  count(*) filter (
    where segunda_compra is not null
      and segunda_compra <= primeira_compra + interval '90 days'
  )                                                                    as voltaram_90d,
  round(100.0 * count(*) filter (
    where segunda_compra is not null
      and segunda_compra <= primeira_compra + interval '90 days'
  ) / nullif(count(*), 0), 1)                                          as taxa_90d_pct,
  round(100.0 * count(*) filter (
    where segunda_compra is not null
      and segunda_compra <= primeira_compra + interval '180 days'
  ) / nullif(count(*), 0), 1)                                          as taxa_180d_pct,
  -- Coortes recentes ainda não completaram a janela: leia a taxa
  -- de 90d só quando janela_90d_fechada = true.
  (now() >= max(primeira_compra) + interval '90 days')                 as janela_90d_fechada
from recompras
group by 1
order by 1 desc;


-- =============================================================
-- BLOCO 5 — Tempo até a recompra (mediana)
-- Diz QUANDO disparar o follow-up de 2ª compra.
-- =============================================================
with compras as (
  select lower(trim(customer_email)) as cliente, occurred_at
  from public.v_financial_ledger
  where kind = 'income' and status = 'pago'
    and coalesce(is_test, false) = false
    and nullif(trim(customer_email), '') is not null
),
pares as (
  select
    cliente,
    occurred_at,
    lead(occurred_at) over (partition by cliente order by occurred_at) as proxima
  from compras
)
select
  count(*)                                                                as intervalos_observados,
  round(percentile_cont(0.5) within group (
    order by extract(epoch from (proxima - occurred_at)) / 86400
  )::numeric, 1)                                                          as mediana_dias,
  round(avg(extract(epoch from (proxima - occurred_at)) / 86400)::numeric, 1) as media_dias,
  round(percentile_cont(0.9) within group (
    order by extract(epoch from (proxima - occurred_at)) / 86400
  )::numeric, 1)                                                          as p90_dias
from pares
where proxima is not null;


-- =============================================================
-- BLOCO 6 — Quem são os clientes que voltaram
-- Lista pra ação: relacionamento, indicação, convite pra clube.
-- =============================================================
select
  lower(trim(customer_email))                                as cliente,
  max(coalesce(nullif(trim(customer_name), ''), '—'))        as nome,
  count(*)                                                   as compras,
  string_agg(distinct source, ', ')                          as fontes,
  sum(amount_centavos) / 100.0                               as total_gasto_reais,
  (min(occurred_at) at time zone 'America/Sao_Paulo')::date  as primeira,
  (max(occurred_at) at time zone 'America/Sao_Paulo')::date  as ultima
from public.v_financial_ledger
where kind = 'income' and status = 'pago'
  and coalesce(is_test, false) = false
  and nullif(trim(customer_email), '') is not null
group by 1
having count(*) >= 2
order by compras desc, total_gasto_reais desc;
