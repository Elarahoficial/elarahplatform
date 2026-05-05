-- =============================================================
-- ELARAH — Financial Ledger v4: inclui gift_cards na receita
-- -------------------------------------------------------------
-- Gift card vendido = receita real (cliente pagou via Stripe). Antes
-- não contava em "Receita confirmada"/Lançamentos. Agora entra como
-- 4ª source ('giftcard'), kind='income'.
--
-- Mapping de status:
--   active   → pago        (foi pago, está válido)
--   used     → pago        (foi pago, já consumido)
--   expired  → pago        (foi pago, só expirou sem uso)
--   pending  → pending     (aguardando pagamento)
--   cancelled→ cancelado
--
-- Sem fornecedor/repasse: gift cards não têm experience_id ou
-- supplier vinculado. experience_name vira "Gift Card <code>" pra
-- ficar legível na tabela.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

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
  null::text                                          as description
from public.bookings b

union all

select
  ms.id::text                                         as id,
  'manual_sale'::text                                 as source,
  'income'::text                                      as kind,
  coalesce(ms.sale_date::timestamptz, ms.created_at)  as occurred_at,
  coalesce(ms.total_amount_centavos, 0)               as amount_centavos,
  ms.payment_status                                   as status,
  ms.experience_id                                    as experience_id,
  coalesce(ms.experience_name, e.nome)                as experience_name,
  coalesce(ms.payout_amount_centavos, 0)              as payout_centavos,
  coalesce(nullif(trim(ms.supplier_name), ''), e.fornecedor_nome) as supplier_name,
  case ms.payout_status
    when 'pago' then 'repasse_feito'
    when 'pendente' then 'repasse_pendente'
    else null
  end                                                 as payout_status,
  ms.customer_email                                   as customer_email,
  ms.customer_name                                    as customer_name,
  null::text                                          as category_slug,
  null::text                                          as description
from public.manual_sales ms
left join public.experiences e on e.id = ms.experience_id

union all

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
  fe.description                                      as description
from public.financial_expenses fe
left join public.financial_categories fc on fc.id = fe.category_id

union all

-- Gift Cards: receita standalone, sem experiência/fornecedor.
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
  null::text                                          as description
from public.gift_cards g;

grant select on public.v_financial_ledger to authenticated, service_role;

-- ===== RPC financial_summary v2: inclui giftcard na receita =====
create or replace function public.financial_summary(
  p_date_from   timestamptz default null,
  p_date_to     timestamptz default null,
  p_experience  uuid        default null,
  p_supplier    text        default null
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
  qty_expenses                   integer
)
language sql
security invoker
stable
as $$
  with l as (
    select *
    from public.v_financial_ledger
    where (p_date_from  is null or occurred_at >= p_date_from)
      and (p_date_to    is null or occurred_at <= p_date_to)
      and (p_experience is null or experience_id = p_experience)
      and (p_supplier   is null
           or lower(regexp_replace(coalesce(supplier_name,''), '\s+', ' ', 'g'))
              = lower(regexp_replace(p_supplier,                '\s+', ' ', 'g')))
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
      count(*) filter (where source = 'booking'     and status = 'pago')      as qbp,
      count(*) filter (where source = 'manual_sale' and status = 'pago')      as qmp,
      count(*) filter (where source = 'expense')                              as qex
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
    coalesce(qex,   0)::integer
  from recs;
$$;

grant execute on function public.financial_summary(timestamptz, timestamptz, uuid, text)
  to authenticated, service_role;

notify pgrst, 'reload schema';
