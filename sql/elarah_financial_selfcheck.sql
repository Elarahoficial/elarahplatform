-- =============================================================
-- ELARAH — Self-check Financeiro
-- -------------------------------------------------------------
-- Script 100% SELECT. Reproduz, lado a lado, os números que cada
-- aba do admin exibe hoje, decompondo as diferenças centavo a
-- centavo. Use no SQL Editor do Supabase.
--
-- Cada bloco é um SELECT independente — você pode rodar todos
-- de uma vez ou um por um. O resultado esperado está descrito
-- no comentário acima de cada bloco.
--
-- Convenção: tudo em centavos (igual ao resto do projeto).
-- =============================================================


-- =============================================================
-- BLOCO 1 — Espelho de "Compras (Pagas)"
-- -------------------------------------------------------------
-- Reproduz: card "RECEITA CONFIRMADA" da aba Compras.
-- Lógica do JS (admin.js:2088-2126):
--   Σ bookings.amount_total (status='pago', exclui experiência teste)
--   + Σ manual_sales.total_amount_centavos (payment_status='pago')
--   gift cards NÃO entram.
-- =============================================================
with bookings_pagas as (
  select
    count(*)                               as qty_bookings_pagas,
    coalesce(sum(amount_total), 0)         as receita_bookings_centavos
  from public.bookings
  where status = 'pago'
    and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1')
),
manuais_pagas as (
  select
    count(*)                                       as qty_manual_pagas,
    coalesce(sum(total_amount_centavos), 0)        as receita_manual_centavos
  from public.manual_sales
  where payment_status = 'pago'
)
select
  'Compras (espelho do JS)'                                         as fonte,
  b.qty_bookings_pagas,
  m.qty_manual_pagas,
  (b.qty_bookings_pagas + m.qty_manual_pagas)                       as qty_total,
  (b.receita_bookings_centavos + m.receita_manual_centavos)         as receita_centavos,
  ((b.receita_bookings_centavos + m.receita_manual_centavos) / 100.0)::numeric(14,2) as receita_reais
from bookings_pagas b cross join manuais_pagas m;


-- =============================================================
-- BLOCO 2 — Espelho de "Fornecedores"
-- -------------------------------------------------------------
-- Reproduz: card "FATURAMENTO BRUTO TOTAL" da aba Fornecedores.
-- Lógica do JS (admin.js:5609-5732):
--   Σ valor_cheio_centavos (bookings status='pago', exclui teste)
--   + Σ manual_sales.total_amount_centavos (payment_status='pago')
--   Atenção: usa valor cheio (preço de tabela ANTES de cupom/gift).
--
-- Nota: aqui NÃO simulo a duplicação multi-fornecedor (Bug C),
-- porque o totalizador global já é único por booking. A duplicação
-- só apareceria se eu agrupasse por fornecedor — ver Bloco 7.
-- =============================================================
with bookings_pagas as (
  select
    count(*)                                       as qty,
    coalesce(sum(valor_cheio_centavos), 0)         as bruto_centavos
  from public.bookings
  where status = 'pago'
    and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1')
),
manuais_pagas as (
  select
    count(*)                                       as qty,
    coalesce(sum(total_amount_centavos), 0)        as bruto_centavos
  from public.manual_sales
  where payment_status = 'pago'
)
select
  'Fornecedores (espelho do JS)'                                    as fonte,
  (b.qty + m.qty)                                                   as qty_total,
  (b.bruto_centavos + m.bruto_centavos)                             as faturamento_bruto_centavos,
  ((b.bruto_centavos + m.bruto_centavos) / 100.0)::numeric(14,2)    as faturamento_bruto_reais
from bookings_pagas b cross join manuais_pagas m;


-- =============================================================
-- BLOCO 3 — Espelho de "Contabilidade" (RPC oficial)
-- -------------------------------------------------------------
-- Reproduz: card "RECEITA CONFIRMADA" da aba Contabilidade.
-- Usa direto a RPC financial_summary (fonte de verdade atual).
-- Não filtra teste (esse é justamente o desvio vs Compras).
-- =============================================================
select
  'Contabilidade (RPC financial_summary)'                           as fonte,
  receita_confirmada_centavos,
  (receita_confirmada_centavos / 100.0)::numeric(14,2)              as receita_confirmada_reais,
  receita_pendente_centavos,
  gastos_pagos_centavos,
  repasses_pendentes_centavos,
  repasses_pagos_centavos,
  lucro_estimado_centavos,
  qty_bookings_pagos,
  qty_manual_sales_pagas
from public.financial_summary(null, null, null, null);


-- =============================================================
-- BLOCO 4 — Espelho de "Analytics" no preset "Tudo" (com o BUG)
-- -------------------------------------------------------------
-- Reproduz: card "FATURAMENTO" da aba Analytics quando preset=Tudo.
-- Lógica do JS (admin.js:5998-6005, com bug A em 5950-5956):
--   Σ amount_total (bookings status='pago', exclui teste).
--   Manual_sales e gift_cards SOMEM porque o filtro de data fica
--   gte('created_at', NOW) — retorna vazio.
--
-- Por isso o resultado deve bater com o "receita_bookings" do bloco 1
-- (NÃO com o total).
-- =============================================================
select
  'Analytics Tudo (espelho do JS, com Bug A)'                       as fonte,
  count(*)                                                          as qty_bookings_pagas,
  coalesce(sum(amount_total), 0)                                    as faturamento_centavos,
  (coalesce(sum(amount_total), 0) / 100.0)::numeric(14,2)           as faturamento_reais,
  case when count(*) > 0
       then (sum(amount_total) / count(*))::int
       else 0
  end                                                               as ticket_medio_centavos
from public.bookings
where status = 'pago'
  and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1');


-- =============================================================
-- BLOCO 5 — Decomposição: Compras vs Fornecedores
-- -------------------------------------------------------------
-- Mostra de onde vem o delta entre "Receita confirmada" (líquido
-- após cupom + gift_card) e "Faturamento bruto" (preço de tabela).
-- Esperado: bruto - liquido = Σ cupom + Σ gift_card aplicado.
-- =============================================================
select
  count(*)                                                          as qty_bookings_pagas,
  coalesce(sum(valor_cheio_centavos), 0)                            as bruto_centavos,
  coalesce(sum(amount_total), 0)                                    as liquido_centavos,
  coalesce(sum(coupon_discount_centavos), 0)                        as cupom_aplicado_centavos,
  coalesce(sum(gift_card_centavos), 0)                              as gift_card_aplicado_centavos,
  -- Identidade contábil: bruto - liquido = cupom + gift_card - card_fee
  -- (card_fee não existe como coluna, vem de metadata.card_fee_total_centavos)
  (coalesce(sum(valor_cheio_centavos), 0) - coalesce(sum(amount_total), 0)) as delta_total_centavos,
  (coalesce(sum(coupon_discount_centavos), 0) +
   coalesce(sum(gift_card_centavos), 0))                            as descontos_totais_centavos,
  ((coalesce(sum(valor_cheio_centavos), 0) - coalesce(sum(amount_total), 0)) / 100.0)::numeric(14,2)
                                                                    as delta_total_reais
from public.bookings
where status = 'pago'
  and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1');


-- =============================================================
-- BLOCO 6 — Decomposição: Contabilidade vs Compras
-- -------------------------------------------------------------
-- Quebra a "Receita confirmada" da Contabilidade pelos 3 sources
-- e mostra: (a) quanto vem de gift cards (que Compras ignora),
-- (b) quanto vem de bookings de TESTE (que Compras filtra).
-- =============================================================
select
  source,
  count(*)                                                          as qty,
  coalesce(sum(amount_centavos), 0)                                 as receita_centavos,
  (coalesce(sum(amount_centavos), 0) / 100.0)::numeric(14,2)        as receita_reais,
  count(*) filter (
    where source = 'booking'
      and lower(coalesce(experience_name, '')) in ('teste', 'teste 1')
  )                                                                 as bookings_teste_qty,
  coalesce(sum(amount_centavos) filter (
    where source = 'booking'
      and lower(coalesce(experience_name, '')) in ('teste', 'teste 1')
  ), 0)                                                             as bookings_teste_centavos
from public.v_financial_ledger
where kind = 'income'
  and status = 'pago'
group by source
order by source;


-- =============================================================
-- BLOCO 7 — Risco: bookings com MAIS DE 1 fornecedor (Bug C)
-- -------------------------------------------------------------
-- O agregador de Fornecedores soma valor_cheio uma vez por
-- fornecedor. Hoje quase certamente o resultado é 0 — o bug é
-- latente. Se aparecer alguma linha aqui, o totalizador global
-- da aba Fornecedores está inflado.
-- =============================================================
select
  id,
  experiencia_nome,
  status,
  valor_cheio_centavos,
  jsonb_array_length(repasses)                                      as qtd_fornecedores
from public.bookings
where status = 'pago'
  and repasses is not null
  and jsonb_typeof(repasses) = 'array'
  and jsonb_array_length(repasses) > 1
order by created_at desc
limit 50;


-- =============================================================
-- BLOCO 8 — Sanity: bookings pagas com amount_total = 0
-- -------------------------------------------------------------
-- Tipicamente: gift card cobriu 100% do checkout. Não é bug —
-- só vale conferir que o gift_card_centavos correspondente
-- existe (pra ter certeza que o evento foi de fato custeado).
-- =============================================================
select
  id,
  experiencia_nome,
  amount_total,
  coupon_discount_centavos,
  gift_card_centavos,
  valor_cheio_centavos,
  created_at
from public.bookings
where status = 'pago'
  and (amount_total is null or amount_total = 0)
order by created_at desc
limit 50;


-- =============================================================
-- BLOCO 9 — Sanity: limite de carregamento parcial (PostgREST)
-- -------------------------------------------------------------
-- O JS faz select sem .limit(), e o PostgREST corta em 1000.
-- Se o total passar de 1000, Compras/Fornecedores/Analytics
-- começam a perder dados silenciosamente. Hoje provavelmente
-- está abaixo, mas vale acompanhar.
-- =============================================================
select
  (select count(*) from public.bookings)                            as bookings_total,
  (select count(*) from public.bookings where status = 'pago')      as bookings_pagas,
  (select count(*) from public.manual_sales)                        as manual_sales_total,
  (select count(*) from public.gift_cards)                          as gift_cards_total,
  case
    when (select count(*) from public.bookings) >= 1000
      then 'ATENÇÃO: passou de 1000 — JS está cortando'
    when (select count(*) from public.bookings) >= 800
      then 'Aproximando do limite (800+)'
    else 'OK (abaixo do default 1000)'
  end                                                               as alerta_limite;


-- =============================================================
-- BLOCO 10 — Distribuição de status (caça a status órfãos)
-- -------------------------------------------------------------
-- Procura inconsistências de nomenclatura ('pending' vs 'pendente',
-- status novos não mapeados, etc). Se aparecer algo fora do
-- esperado, alguma aba vai contar errado.
-- =============================================================
select 'bookings'      as origem, status,         count(*) as qty from public.bookings      group by status
union all
select 'manual_sales'  as origem, payment_status, count(*) as qty from public.manual_sales  group by payment_status
union all
select 'gift_cards'    as origem, status,         count(*) as qty from public.gift_cards    group by status
union all
select 'expenses'      as origem, status,         count(*) as qty from public.financial_expenses group by status
order by origem, status;


-- =============================================================
-- BLOCO 11 — Reconciliação consolidada (todas as abas em 1 tabela)
-- -------------------------------------------------------------
-- Resultado esperado: as 4 linhas devem fechar com os cards do
-- admin (centavo a centavo). Se alguma divergir, é sinal de
-- regressão (alguém mexeu sem atualizar este script).
-- =============================================================
with
compras as (
  select coalesce(sum(amount_total), 0) +
         coalesce((select sum(total_amount_centavos)
                   from public.manual_sales
                   where payment_status = 'pago'), 0) as v
  from public.bookings
  where status = 'pago'
    and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1')
),
fornecedores as (
  select coalesce(sum(valor_cheio_centavos), 0) +
         coalesce((select sum(total_amount_centavos)
                   from public.manual_sales
                   where payment_status = 'pago'), 0) as v
  from public.bookings
  where status = 'pago'
    and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1')
),
contabilidade as (
  select receita_confirmada_centavos as v
  from public.financial_summary(null, null, null, null)
),
analytics_tudo as (
  select coalesce(sum(amount_total), 0) as v
  from public.bookings
  where status = 'pago'
    and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1')
)
select 'Compras (receita confirmada)'         as aba, v as centavos, (v/100.0)::numeric(14,2) as reais from compras
union all
select 'Fornecedores (faturamento bruto)'     as aba, v as centavos, (v/100.0)::numeric(14,2) as reais from fornecedores
union all
select 'Contabilidade (receita confirmada)'   as aba, v as centavos, (v/100.0)::numeric(14,2) as reais from contabilidade
union all
select 'Analytics Tudo (faturamento, c/ bug)' as aba, v as centavos, (v/100.0)::numeric(14,2) as reais from analytics_tudo
order by aba;
