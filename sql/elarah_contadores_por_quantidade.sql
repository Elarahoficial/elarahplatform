-- =============================================================
-- ELARAH — Contadores por quantidade (participantes/vagas)
-- -------------------------------------------------------------
-- Resolve: 1 booking com quantidade=3 estava contando como 1 compra
-- em métricas de volume. Pra análise de performance e operação,
-- precisamos contar 3 vagas/participantes, não 1 reserva.
--
-- Faturamento NÃO muda — segue agregando amount_total.
-- Apenas contadores de volume passam a usar sum(quantidade).
--
-- Mudanças (todas idempotentes):
--   1. v_financial_ledger ganha coluna `quantity` no FINAL
--      - booking:     coalesce(quantidade, 1)
--      - manual_sale: coalesce(quantity, 1)
--      - giftcard:    1
--      - expense:     1 (irrelevante)
--   2. financial_summary v3: qty_*_pagos vira sum(quantity)
--   3. financial_by_supplier: qty_* vira sum(quantity)
--   4. financial_by_experience: qty_* vira sum(quantity)
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================


-- ===== 1. v_financial_ledger: adiciona quantity =====
-- Nova coluna no FINAL pra preservar a ordem das anteriores
-- (PostgreSQL não permite alterar ordem em CREATE OR REPLACE VIEW).
create or replace view public.v_financial_ledger as
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
  -- v5
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
  -- NOVA: quantidade de vagas/participantes
  greatest(coalesce(b.quantidade, 1), 1)              as quantity
from public.bookings b
left join public.experiences eb on eb.id = b.experiencia_id

union all

select
  ms.id::text                                         as id,
  'manual_sale'::text                                 as source,
  'income'::text                                      as kind,
  coalesce(ms.sale_date::timestamptz, ms.created_at)  as occurred_at,
  coalesce(ms.total_amount_centavos, 0)               as amount_centavos,
  ms.payment_status                                   as status,
  ms.experience_id                                    as experience_id,
  coalesce(ms.experience_name, ems.nome)              as experience_name,
  coalesce(ms.payout_amount_centavos, 0)              as payout_centavos,
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
  -- v5
  (coalesce(ms.total_amount_centavos, 0)
   + coalesce(ms.discount_centavos, 0))               as gross_centavos,
  coalesce(ms.discount_centavos, 0)                   as discount_centavos,
  coalesce(ems.is_test, false)                        as is_test,
  -- NOVA: quantity da venda manual
  greatest(coalesce(ms.quantity, 1), 1)               as quantity
from public.manual_sales ms
left join public.experiences ems on ems.id = ms.experience_id

union all

-- Despesas: quantity=1, irrelevante
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
  1                                                   as quantity
from public.financial_expenses fe
left join public.financial_categories fc on fc.id = fe.category_id
left join public.experiences efe on efe.id = fe.experience_id

union all

-- Gift cards: quantity=1 (cada gift card é uma unidade)
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
  1                                                   as quantity
from public.gift_cards g;

grant select on public.v_financial_ledger to authenticated, service_role;


-- ===== 2. financial_summary: qty_* agora reflete sum(quantity) =====
-- A semântica passa a ser "número de participantes/vagas vendidas",
-- não "número de transações". Backwards compat preservada porque
-- a JS lê `qty_bookings_pagos` etc. com mesmo nome — só o número
-- aumenta quando há bookings com quantidade > 1.
drop function if exists public.financial_summary(timestamptz, timestamptz, uuid, text, text[], boolean);

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
  qty_bookings_pagos             integer,    -- agora = sum(quantidade)
  qty_manual_sales_pagas         integer,    -- agora = sum(quantity)
  qty_giftcards_pagos            integer,    -- gift card = 1 cada
  qty_expenses                   integer,    -- count puro (gastos não tem qty)
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
      -- AGORA SOMA QUANTIDADE em vez de count(*)
      coalesce(sum(quantity) filter (where source = 'booking'     and status = 'pago'), 0)    as qbp,
      coalesce(sum(quantity) filter (where source = 'manual_sale' and status = 'pago'), 0)    as qmp,
      coalesce(sum(quantity) filter (where source = 'giftcard'    and status = 'pago'), 0)    as qgp,
      count(*) filter (where source = 'expense')                                              as qex
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


-- ===== 3. financial_by_supplier: qty_* vira sum(quantity) =====
-- Por fornecedor: qty_reservas, qty_bookings, qty_manual passam
-- a contar PARTICIPANTES (sum quantity), não transações.
drop function if exists public.financial_by_supplier(timestamptz, timestamptz, boolean);

create or replace function public.financial_by_supplier(
  p_date_from    timestamptz default null,
  p_date_to      timestamptz default null,
  p_include_test boolean     default false
)
returns table (
  supplier_key                 text,
  supplier_name                text,
  qty_reservas                 integer,
  qty_bookings                 integer,
  qty_manual                   integer,
  faturamento_centavos         bigint,
  receita_centavos             bigint,
  repasse_total_centavos       bigint,
  repasse_pendente_centavos    bigint,
  repasse_pago_centavos        bigint,
  comissao_centavos            bigint,
  ultima_venda                 timestamptz
)
language sql
security invoker
stable
as $$
  with
  bk as (
    select
      b.id,
      b.created_at,
      coalesce(b.valor_cheio_centavos,
        coalesce(b.amount_total,0)
          + coalesce(b.coupon_discount_centavos,0)
          + coalesce(b.gift_card_centavos,0))                       as gross_centavos,
      coalesce(b.amount_total, 0)                                   as receita_centavos,
      b.status_fornecedor                                           as payout_status,
      b.repasses,
      b.fornecedor_nome,
      b.valor_repasse_centavos,
      b.valor_comissao_centavos,
      greatest(coalesce(b.quantidade, 1), 1)                        as quantity
    from public.bookings b
    left join public.experiences e on e.id = b.experiencia_id
    where b.status = 'pago'
      and (p_date_from is null or b.created_at >= p_date_from)
      and (p_date_to   is null or b.created_at <= p_date_to)
      and (p_include_test = true
           or (lower(coalesce(b.experiencia_nome,'')) not in ('teste','teste 1')
               and coalesce(e.is_test,false) = false))
  ),
  bk_repasses as (
    select
      bk.id,
      bk.created_at,
      bk.gross_centavos,
      bk.receita_centavos,
      bk.payout_status,
      bk.quantity,
      trim((elem->>'fornecedor_nome'))                              as supplier_name,
      coalesce((elem->>'valor_centavos')::bigint, 0)                as payout_centavos,
      false                                                          as is_principal,
      0::int                                                         as ord
    from bk
    cross join lateral jsonb_array_elements(bk.repasses) with ordinality as t(elem, ord)
    where bk.repasses is not null
      and jsonb_typeof(bk.repasses) = 'array'
      and jsonb_array_length(bk.repasses) > 0
  ),
  bk_legacy as (
    select
      bk.id,
      bk.created_at,
      bk.gross_centavos,
      bk.receita_centavos,
      bk.payout_status,
      bk.quantity,
      trim(bk.fornecedor_nome)                                       as supplier_name,
      coalesce(bk.valor_repasse_centavos, 0)::bigint                 as payout_centavos,
      true                                                            as is_principal,
      1::int                                                          as ord
    from bk
    where bk.repasses is null
       or jsonb_typeof(bk.repasses) <> 'array'
       or jsonb_array_length(bk.repasses) = 0
  ),
  bk_all as (
    select id, created_at, gross_centavos, receita_centavos, payout_status,
           quantity, supplier_name, payout_centavos, (ord = 1) as is_principal
    from bk_repasses
    union all
    select id, created_at, gross_centavos, receita_centavos, payout_status,
           quantity, supplier_name, payout_centavos, is_principal
    from bk_legacy
  ),
  bk_norm as (
    select
      lower(regexp_replace(coalesce(supplier_name,''), '\s+', ' ', 'g')) as supplier_key,
      supplier_name,
      'booking'::text                                                as source,
      id, created_at, gross_centavos, receita_centavos, payout_status,
      quantity, payout_centavos, is_principal
    from bk_all
    where coalesce(supplier_name,'') <> ''
  ),
  ms as (
    select
      ms.id,
      coalesce(ms.sale_date::timestamptz, ms.created_at)             as created_at,
      (coalesce(ms.total_amount_centavos,0)
        + coalesce(ms.discount_centavos,0))                          as gross_centavos,
      coalesce(ms.total_amount_centavos, 0)                          as receita_centavos,
      case ms.payout_status
        when 'pago' then 'repasse_feito'
        when 'pendente' then 'repasse_pendente'
        else null end                                                as payout_status,
      coalesce(nullif(trim(ms.supplier_name),''), ems.fornecedor_nome) as supplier_name,
      coalesce(ms.payout_amount_centavos, 0)::bigint                 as payout_centavos,
      greatest(coalesce(ms.quantity, 1), 1)                          as quantity
    from public.manual_sales ms
    left join public.experiences ems on ems.id = ms.experience_id
    where ms.payment_status = 'pago'
      and (p_date_from is null or coalesce(ms.sale_date::timestamptz, ms.created_at) >= p_date_from)
      and (p_date_to   is null or coalesce(ms.sale_date::timestamptz, ms.created_at) <= p_date_to)
      and (p_include_test = true or coalesce(ems.is_test, false) = false)
  ),
  ms_norm as (
    select
      lower(regexp_replace(coalesce(supplier_name,''), '\s+', ' ', 'g')) as supplier_key,
      supplier_name,
      'manual_sale'::text                                            as source,
      id, created_at, gross_centavos, receita_centavos, payout_status,
      quantity, payout_centavos,
      true as is_principal
    from ms
    where coalesce(supplier_name,'') <> ''
  ),
  unioned as (
    select * from bk_norm
    union all
    select * from ms_norm
  ),
  with_total_payouts as (
    select
      u.*,
      sum(payout_centavos) over (partition by id) as total_payouts_centavos
    from unioned u
  )
  select
    supplier_key,
    (array_agg(supplier_name order by created_at desc))[1]           as supplier_name,
    -- AGORA conta PARTICIPANTES (sum quantity) em vez de transações
    coalesce(sum(quantity), 0)::int                                  as qty_reservas,
    coalesce(sum(quantity) filter (where source = 'booking'), 0)::int     as qty_bookings,
    coalesce(sum(quantity) filter (where source = 'manual_sale'), 0)::int as qty_manual,
    sum(gross_centavos)::bigint                                      as faturamento_centavos,
    sum(receita_centavos)::bigint                                    as receita_centavos,
    sum(payout_centavos)::bigint                                     as repasse_total_centavos,
    sum(case when payout_status = 'repasse_pendente' then payout_centavos else 0 end)::bigint
                                                                     as repasse_pendente_centavos,
    sum(case when payout_status = 'repasse_feito'    then payout_centavos else 0 end)::bigint
                                                                     as repasse_pago_centavos,
    sum(case when is_principal
             then receita_centavos - total_payouts_centavos
             else 0 end)::bigint                                     as comissao_centavos,
    max(created_at)                                                  as ultima_venda
  from with_total_payouts
  group by supplier_key
  order by faturamento_centavos desc nulls last;
$$;

grant execute on function public.financial_by_supplier(timestamptz, timestamptz, boolean)
  to authenticated, service_role;


-- ===== 4. financial_by_experience: qty_* vira sum(quantity) =====
create or replace function public.financial_by_experience(
  p_date_from   timestamptz default null,
  p_date_to     timestamptz default null
)
returns table (
  experience_id              uuid,
  experience_name            text,
  qty_site                   integer,
  qty_manual                 integer,
  receita_centavos           bigint,
  repasse_centavos           bigint,
  gastos_centavos            bigint,
  lucro_centavos             bigint
)
language sql
security invoker
stable
as $$
  with l as (
    select *
    from public.v_financial_ledger
    where (p_date_from is null or occurred_at >= p_date_from)
      and (p_date_to   is null or occurred_at <= p_date_to)
      and is_test = false
      and experience_id is not null
  )
  select
    l.experience_id,
    coalesce(max(l.experience_name), '')::text                                    as experience_name,
    -- Conta PARTICIPANTES (sum quantity) em vez de transações
    coalesce(sum(quantity) filter (where source = 'booking'     and status = 'pago'), 0)::int as qty_site,
    coalesce(sum(quantity) filter (where source = 'manual_sale' and status = 'pago'), 0)::int as qty_manual,
    sum(case when source in ('booking','manual_sale') and status = 'pago'
             then amount_centavos else 0 end)::bigint                             as receita,
    sum(case when source in ('booking','manual_sale') and status = 'pago'
             then payout_centavos else 0 end)::bigint                             as repasse,
    sum(case when source = 'expense'  and status = 'pago'
             then amount_centavos else 0 end)::bigint                             as gastos,
    (sum(case when source in ('booking','manual_sale') and status = 'pago'
             then amount_centavos else 0 end)
     - sum(case when source in ('booking','manual_sale') and status = 'pago'
             then payout_centavos else 0 end)
     - sum(case when source = 'expense' and status = 'pago'
             then amount_centavos else 0 end))::bigint                            as lucro
  from l
  group by l.experience_id
  order by receita desc nulls last;
$$;

grant execute on function public.financial_by_experience(timestamptz, timestamptz)
  to authenticated, service_role;


notify pgrst, 'reload schema';
