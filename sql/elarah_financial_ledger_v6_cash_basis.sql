-- =============================================================
-- ELARAH — Financial Ledger v6: regime de CAIXA para vendas manuais
-- -------------------------------------------------------------
-- PROBLEMA que isto resolve:
--   Vendas manuais com entrada + restante (eventos parcelados) eram
--   contabilizadas pelo VALOR CHEIO no momento em que payment_status
--   virava 'pago', tudo na data da venda (sale_date). O cronograma de
--   pagamentos (coluna payments: entrada/parcelas com flag "pago") era
--   apenas um bilhete visual — NÃO alimentava a contabilidade.
--   Resultado: a venda inteira "caía" antes do dinheiro entrar, e
--   registrar o restante depois não movia nada no mês do recebimento.
--
-- O QUE MUDA (só para vendas manuais):
--   v_financial_ledger passa a emitir UMA LINHA POR PARCELA recebível.
--   Cada parcela conta:
--     - amount_centavos = valor_centavos da parcela
--     - occurred_at     = data da parcela (fallback: sale_date/created_at)
--     - status          = 'pago' se a parcela está marcada paga, senão
--                         'pendente' (a menos que a venda inteira esteja
--                         cancelada/reembolsada — aí todas herdam isso).
--   Ou seja: receita confirmada = soma do que FOI RECEBIDO, cada parcela
--   no mês em que entrou. Regime de caixa.
--
--   Vendas SEM cronograma (payments vazio) continuam idênticas ao v5:
--   uma linha, valor cheio, status = payment_status, data = sale_date.
--   (Um fallback sintetiza uma "parcela única" a partir do total.)
--
--   payout / gross / discount ficam só na 1ª parcela (ord=1) para não
--   multiplicar em vendas parceladas. Nova coluna group_id (id da venda
--   original) permite contar VENDAS distintas mesmo com linhas por parcela.
--
-- ADITIVO em cima de v5 (elarah_financial_ledger_v5_unified.sql):
--   - v_financial_ledger ganha 1 coluna no FINAL: group_id.
--   - financial_summary passa a contar qty_manual_sales_pagas por
--     group_id distinto (vendas, não parcelas). Mesma assinatura.
--   - financial_evolution e financial_by_supplier NÃO mudam de código:
--       * financial_evolution lê a view, então já herda o regime de caixa.
--       * financial_by_supplier lê manual_sales direto e permanece em
--         regime de COMPETÊNCIA de propósito — o repasse/comissão do
--         fornecedor é sobre o valor cheio do negócio, não sobre quando
--         o cliente paga a Elarah. Documentado aqui para não confundir.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- REVERSÍVEL — rodar elarah_financial_ledger_v5_unified.sql desfaz a view
--              e a RPC (a coluna group_id deixa de existir; nada depende
--              dela fora deste arquivo).
-- =============================================================


-- ===== 1. v_financial_ledger v6 =====
-- Recriada do zero (DROP + CREATE) em vez de CREATE OR REPLACE: como
-- as vendas manuais agora somam por parcela, o tipo/append de colunas
-- muda e CREATE OR REPLACE dispararia 42P16 ("cannot change data type
-- of view column"). DROP evita isso. Seguro: nenhuma outra VIEW depende
-- desta — só funções SQL (financial_summary/evolution/by_supplier) e
-- queries, que não são dependências rígidas e re-resolvem a view depois.
drop view if exists public.v_financial_ledger;

create view public.v_financial_ledger as

-- Bookings (site) — inalterado, group_id = id.
select
  b.id::text                                          as id,
  'booking'::text                                     as source,
  'income'::text                                      as kind,
  b.created_at                                        as occurred_at,
  coalesce(b.amount_total, 0)                         as amount_centavos,
  b.status                                            as status,
  b.experiencia_id                                    as experience_id,
  b.experiencia_nome                                  as experience_name,
  case
    when b.repasses is not null and jsonb_typeof(b.repasses) = 'array' then
      coalesce((
        select sum((elem->>'valor_centavos')::int)
        from jsonb_array_elements(b.repasses) elem
      ), 0)
    else coalesce(b.valor_repasse_centavos, 0)
  end                                                 as payout_centavos,
  b.fornecedor_nome                                   as supplier_name,
  b.status_fornecedor                                 as payout_status,
  b.email                                             as customer_email,
  coalesce(b.nome, '')                                as customer_name,
  null::text                                          as category_slug,
  null::text                                          as description,
  coalesce(
    b.valor_cheio_centavos,
    coalesce(b.amount_total, 0)
      + coalesce(b.coupon_discount_centavos, 0)
      + coalesce(b.gift_card_centavos, 0)
  )                                                   as gross_centavos,
  (coalesce(b.coupon_discount_centavos, 0)
   + coalesce(b.gift_card_centavos, 0))               as discount_centavos,
  (lower(coalesce(b.experiencia_nome, '')) in ('teste', 'teste 1')
   or coalesce(eb.is_test, false))                    as is_test,
  -- NOVA COLUNA (sempre no final):
  b.id::text                                          as group_id
from public.bookings b
left join public.experiences eb on eb.id = b.experiencia_id

union all

-- Vendas manuais — REGIME DE CAIXA: uma linha por parcela recebível.
-- O lateral 'p' explode o cronograma de pagamentos; quando não há
-- cronograma, sintetiza uma parcela única com o total (data = sale_date,
-- pago = (payment_status='pago')) — replicando exatamente o v5.
select
  ms.id::text || '#p' || p.ord                        as id,
  'manual_sale'::text                                 as source,
  'income'::text                                      as kind,
  coalesce(
    nullif(p.elem->>'data', '')::timestamptz,
    ms.sale_date::timestamptz,
    ms.created_at
  )                                                   as occurred_at,
  -- ::numeric->::int tolera "30000" e "30000.0"; mantém a coluna
  -- amount_centavos como integer (o v5 já era integer — CREATE OR
  -- REPLACE VIEW não permite trocar o tipo de coluna existente).
  coalesce((p.elem->>'valor_centavos')::numeric, 0)::int as amount_centavos,
  -- Cancelada/reembolsada manda em TODAS as parcelas; senão, a flag
  -- "pago" da parcela decide entre 'pago' e 'pendente'.
  case
    when ms.payment_status in ('cancelado', 'reembolsado') then ms.payment_status
    when coalesce((p.elem->>'pago')::boolean, false)       then 'pago'
    else 'pendente'
  end                                                 as status,
  ms.experience_id                                    as experience_id,
  coalesce(ms.experience_name, ems.nome)              as experience_name,
  -- payout só na 1ª parcela pra não multiplicar em vendas parceladas.
  case when p.ord = 1 then coalesce(ms.payout_amount_centavos, 0) else 0 end as payout_centavos,
  coalesce(nullif(trim(ms.supplier_name), ''), ems.fornecedor_nome) as supplier_name,
  case ms.payout_status
    when 'pago' then 'repasse_feito'
    when 'pendente' then 'repasse_pendente'
    else null
  end                                                 as payout_status,
  ms.customer_email                                   as customer_email,
  ms.customer_name                                    as customer_name,
  null::text                                          as category_slug,
  null::text                                          as description,
  -- gross/discount também só na 1ª parcela (valor de tabela do negócio,
  -- reconhecido uma vez — GMV é métrica de negócio, não de caixa).
  case when p.ord = 1
       then (coalesce(ms.total_amount_centavos, 0) + coalesce(ms.discount_centavos, 0))
       else 0 end                                     as gross_centavos,
  case when p.ord = 1 then coalesce(ms.discount_centavos, 0) else 0 end as discount_centavos,
  coalesce(ems.is_test, false)                        as is_test,
  -- NOVA COLUNA: id da venda original (todas as parcelas compartilham).
  ms.id::text                                         as group_id
from public.manual_sales ms
left join public.experiences ems on ems.id = ms.experience_id
cross join lateral (
  select elem, ord
  from jsonb_array_elements(
    case
      when jsonb_typeof(ms.payments) = 'array' and jsonb_array_length(ms.payments) > 0
        then ms.payments
      else jsonb_build_array(jsonb_build_object(
             'valor_centavos', coalesce(ms.total_amount_centavos, 0),
             'data',           ms.sale_date,
             'pago',           (ms.payment_status = 'pago')
           ))
    end
  ) with ordinality as t(elem, ord)
) p

union all

-- Despesas — inalterado, group_id = id.
select
  fe.id::text                                         as id,
  'expense'::text                                     as source,
  'expense'::text                                     as kind,
  (fe.expense_date::timestamptz)                      as occurred_at,
  coalesce(fe.amount_centavos, 0)                     as amount_centavos,
  fe.status                                           as status,
  fe.experience_id                                    as experience_id,
  null::text                                          as experience_name,
  0                                                   as payout_centavos,
  fe.supplier_name                                    as supplier_name,
  null::text                                          as payout_status,
  null::text                                          as customer_email,
  null::text                                          as customer_name,
  fc.slug                                             as category_slug,
  fe.description                                      as description,
  coalesce(fe.amount_centavos, 0)                     as gross_centavos,
  0                                                   as discount_centavos,
  coalesce(efe.is_test, false)                        as is_test,
  -- NOVA COLUNA:
  fe.id::text                                         as group_id
from public.financial_expenses fe
left join public.financial_categories fc on fc.id = fe.category_id
left join public.experiences efe on efe.id = fe.experience_id

union all

-- Gift Cards — inalterado, group_id = id.
select
  g.id::text                                          as id,
  'giftcard'::text                                    as source,
  'income'::text                                      as kind,
  g.created_at                                        as occurred_at,
  coalesce(g.valor_inicial_centavos, 0)               as amount_centavos,
  case g.status
    when 'active'    then 'pago'
    when 'used'      then 'pago'
    when 'expired'   then 'pago'
    when 'pending'   then 'pending'
    when 'cancelled' then 'cancelado'
    else g.status
  end                                                 as status,
  null::uuid                                          as experience_id,
  ('Gift Card' || case when g.code is not null and g.code <> '' then ' ' || g.code else '' end) as experience_name,
  0                                                   as payout_centavos,
  null::text                                          as supplier_name,
  null::text                                          as payout_status,
  g.comprador_email                                   as customer_email,
  coalesce(g.comprador_nome, '')                      as customer_name,
  null::text                                          as category_slug,
  null::text                                          as description,
  coalesce(g.valor_inicial_centavos, 0)               as gross_centavos,
  0                                                   as discount_centavos,
  false                                               as is_test,
  -- NOVA COLUNA:
  g.id::text                                          as group_id
from public.gift_cards g;

grant select on public.v_financial_ledger to authenticated, service_role;


-- ===== 2. financial_summary v4 =====
-- Mesma assinatura e mesmas colunas de retorno do v5. Única mudança de
-- comportamento: qty_manual_sales_pagas conta VENDAS distintas
-- (group_id), não parcelas — agora que uma venda pode gerar N linhas.
-- receita_confirmada/pendente já ficam corretas automaticamente porque
-- somam amount_centavos por status sobre as linhas-parcela.
create or replace function public.financial_summary(
  p_date_from   timestamptz default null,
  p_date_to     timestamptz default null,
  p_experience  uuid        default null,
  p_supplier    text        default null,
  p_sources     text[]      default null,
  p_include_test boolean    default false
)
returns table (
  receita_confirmada_centavos    bigint,
  receita_pendente_centavos      bigint,
  receita_cancelada_centavos     bigint,
  receita_reembolsada_centavos   bigint,
  gastos_pagos_centavos          bigint,
  gastos_pendentes_centavos      bigint,
  repasses_pendentes_centavos    bigint,
  repasses_pagos_centavos        bigint,
  lucro_estimado_centavos        bigint,
  qty_bookings_pagos             integer,
  qty_manual_sales_pagas         integer,
  qty_giftcards_pagos            integer,
  qty_expenses                   integer,
  gross_confirmado_centavos      bigint,
  discount_confirmado_centavos   bigint
)
language sql
security invoker
stable
as $$
  with l as (
    select *
    from public.v_financial_ledger
    where (p_date_from   is null or occurred_at >= p_date_from)
      and (p_date_to     is null or occurred_at <= p_date_to)
      and (p_experience  is null or experience_id = p_experience)
      and (p_supplier    is null
           or lower(regexp_replace(coalesce(supplier_name,''), '\s+', ' ', 'g'))
              = lower(regexp_replace(p_supplier,                '\s+', ' ', 'g')))
      and (p_sources     is null or source = any(p_sources))
      and (p_include_test = true or is_test = false)
  ),
  recs as (
    select
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'pago'                                  then amount_centavos else 0 end) as rc,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status in ('pending','pendente')                 then amount_centavos else 0 end) as rp,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status in ('cancelado','expirado')               then amount_centavos else 0 end) as rcanc,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'reembolsado'                           then amount_centavos else 0 end) as rref,
      sum(case when source = 'expense' and status = 'pago'           then amount_centavos else 0 end) as gp,
      sum(case when source = 'expense' and status = 'pendente'       then amount_centavos else 0 end) as gpe,
      sum(case when source in ('booking','manual_sale')
                and status = 'pago'
                and payout_status = 'repasse_pendente'               then payout_centavos else 0 end) as rpp,
      sum(case when source in ('booking','manual_sale')
                and status = 'pago'
                and payout_status = 'repasse_feito'                  then payout_centavos else 0 end) as rpf,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'pago'                                  then gross_centavos else 0 end)    as gross_c,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'pago'                                  then discount_centavos else 0 end) as disc_c,
      count(*) filter (where source = 'booking'     and status = 'pago')             as qbp,
      -- VENDAS distintas (não parcelas): uma venda parcelada com entrada
      -- paga conta 1, mesmo gerando várias linhas no ledger.
      count(distinct group_id) filter (where source = 'manual_sale' and status = 'pago') as qmp,
      count(*) filter (where source = 'giftcard'    and status = 'pago')             as qgp,
      count(*) filter (where source = 'expense')                                     as qex
    from l
  )
  select
    coalesce(rc,    0)::bigint,
    coalesce(rp,    0)::bigint,
    coalesce(rcanc, 0)::bigint,
    coalesce(rref,  0)::bigint,
    coalesce(gp,    0)::bigint,
    coalesce(gpe,   0)::bigint,
    coalesce(rpp,   0)::bigint,
    coalesce(rpf,   0)::bigint,
    (coalesce(rc,0) - coalesce(gp,0) - coalesce(rpp,0) - coalesce(rpf,0))::bigint,
    coalesce(qbp,   0)::integer,
    coalesce(qmp,   0)::integer,
    coalesce(qgp,   0)::integer,
    coalesce(qex,   0)::integer,
    coalesce(gross_c, 0)::bigint,
    coalesce(disc_c,  0)::bigint
  from recs;
$$;

grant execute on function public.financial_summary(timestamptz, timestamptz, uuid, text, text[], boolean)
  to authenticated, service_role;


-- Recarrega o cache de schema do PostgREST.
notify pgrst, 'reload schema';
