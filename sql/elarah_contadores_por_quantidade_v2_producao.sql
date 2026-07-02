-- =============================================================
-- ELARAH — Contadores por quantidade (v2, alinhado à PRODUÇÃO)
-- -------------------------------------------------------------
-- Substitui elarah_contadores_por_quantidade.sql, que estava
-- desatualizado: a view v_financial_ledger foi redesenhada em
-- produção (coluna group_id + vendas manuais explodidas por
-- parcela via jsonb_array_elements(ms.payments)).
--
-- ESTADO ENCONTRADO em produção:
--   • financial_by_experience  -> já usa sum(quantity), mas a view
--                                 não tinha a coluna quantity (quebrada).
--   • financial_by_supplier    -> já conta participantes (lê tabelas). OK.
--   • financial_summary        -> ainda usa count(*) p/ booking e
--                                 count(distinct group_id) p/ manual.
--                                 É o que faz o painel mostrar RESERVAS
--                                 em vez de VAGAS.
--
-- O QUE ESTE SCRIPT FAZ (nada além disso):
--   1. Recria v_financial_ledger IDÊNTICA à de produção, só
--      acrescentando a coluna `quantity` NO FIM:
--        - booking:     greatest(coalesce(b.quantidade,1),1)
--        - manual_sale: quantity só na 1ª parcela (ord=1), senão 0
--                       -> somar não multiplica por nº de parcelas
--        - expense/giftcard: 1
--   2. Recria financial_summary IDÊNTICA à de produção, trocando
--      só os 3 contadores de volume para sum(quantity).
--
-- NÃO altera receita, repasse, comissão, parcelamento nem
-- financial_by_supplier/by_experience (já corretas).
-- Só adiciona coluna no fim da view -> CREATE OR REPLACE é seguro,
-- não derruba dependentes.
--
-- IDEMPOTENTE.
-- =============================================================


-- ===== 1. v_financial_ledger: produção + coluna `quantity` no fim =====
create or replace view public.v_financial_ledger as
 select b.id::text as id,
    'booking'::text as source,
    'income'::text as kind,
    b.created_at as occurred_at,
    coalesce(b.amount_total, 0) as amount_centavos,
    b.status,
    b.experiencia_id as experience_id,
    b.experiencia_nome as experience_name,
        case
            when b.repasses is not null and jsonb_typeof(b.repasses) = 'array'::text then coalesce(( select sum((elem.value ->> 'valor_centavos'::text)::integer) as sum
               from jsonb_array_elements(b.repasses) elem(value)), 0::bigint)
            else coalesce(b.valor_repasse_centavos, 0)::bigint
        end as payout_centavos,
    b.fornecedor_nome as supplier_name,
    b.status_fornecedor as payout_status,
    b.email as customer_email,
    coalesce(b.nome, ''::text) as customer_name,
    null::text as category_slug,
    null::text as description,
    coalesce(b.valor_cheio_centavos, coalesce(b.amount_total, 0) + coalesce(b.coupon_discount_centavos, 0) + coalesce(b.gift_card_centavos, 0)) as gross_centavos,
    coalesce(b.coupon_discount_centavos, 0) + coalesce(b.gift_card_centavos, 0) as discount_centavos,
    (lower(coalesce(b.experiencia_nome, ''::text)) = any (array['teste'::text, 'teste 1'::text])) or coalesce(eb.is_test, false) as is_test,
    b.id::text as group_id,
    greatest(coalesce(b.quantidade, 1), 1) as quantity
   from bookings b
     left join experiences eb on eb.id = b.experiencia_id
union all
 select (ms.id::text || '#p'::text) || p.ord as id,
    'manual_sale'::text as source,
    'income'::text as kind,
    coalesce(nullif(p.elem ->> 'data'::text, ''::text)::timestamp with time zone, ms.sale_date::timestamp with time zone, ms.created_at) as occurred_at,
    coalesce((p.elem ->> 'valor_centavos'::text)::numeric, 0::numeric)::integer as amount_centavos,
        case
            when ms.payment_status = any (array['cancelado'::text, 'reembolsado'::text]) then ms.payment_status
            when coalesce((p.elem ->> 'pago'::text)::boolean, false) then 'pago'::text
            else 'pendente'::text
        end as status,
    ms.experience_id,
    coalesce(ms.experience_name, ems.nome) as experience_name,
        case
            when p.ord = 1 then coalesce(ms.payout_amount_centavos, 0)
            else 0
        end as payout_centavos,
    coalesce(nullif(trim(both from ms.supplier_name), ''::text), ems.fornecedor_nome) as supplier_name,
        case ms.payout_status
            when 'pago'::text then 'repasse_feito'::text
            when 'pendente'::text then 'repasse_pendente'::text
            else null::text
        end as payout_status,
    ms.customer_email,
    ms.customer_name,
    null::text as category_slug,
    null::text as description,
        case
            when p.ord = 1 then coalesce(ms.total_amount_centavos, 0) + coalesce(ms.discount_centavos, 0)
            else 0
        end as gross_centavos,
        case
            when p.ord = 1 then coalesce(ms.discount_centavos, 0)
            else 0
        end as discount_centavos,
    coalesce(ems.is_test, false) as is_test,
    ms.id::text as group_id,
    -- quantity só na 1ª parcela: evita multiplicar participantes pelo
    -- número de parcelas quando se faz sum(quantity).
        case
            when p.ord = 1 then greatest(coalesce(ms.quantity, 1), 1)
            else 0
        end as quantity
   from manual_sales ms
     left join experiences ems on ems.id = ms.experience_id
     cross join lateral ( select t.elem,
            t.ord
           from jsonb_array_elements(
                case
                    when jsonb_typeof(ms.payments) = 'array'::text and jsonb_array_length(ms.payments) > 0 then ms.payments
                    else jsonb_build_array(jsonb_build_object('valor_centavos', coalesce(ms.total_amount_centavos, 0), 'data', ms.sale_date, 'pago', ms.payment_status = 'pago'::text))
                end) with ordinality t(elem, ord)) p
union all
 select fe.id::text as id,
    'expense'::text as source,
    'expense'::text as kind,
    fe.expense_date::timestamp with time zone as occurred_at,
    coalesce(fe.amount_centavos, 0) as amount_centavos,
    fe.status,
    fe.experience_id,
    null::text as experience_name,
    0 as payout_centavos,
    fe.supplier_name,
    null::text as payout_status,
    null::text as customer_email,
    null::text as customer_name,
    fc.slug as category_slug,
    fe.description,
    coalesce(fe.amount_centavos, 0) as gross_centavos,
    0 as discount_centavos,
    coalesce(efe.is_test, false) as is_test,
    fe.id::text as group_id,
    1 as quantity
   from financial_expenses fe
     left join financial_categories fc on fc.id = fe.category_id
     left join experiences efe on efe.id = fe.experience_id
union all
 select g.id::text as id,
    'giftcard'::text as source,
    'income'::text as kind,
    g.created_at as occurred_at,
    coalesce(g.valor_inicial_centavos, 0) as amount_centavos,
        case g.status
            when 'active'::text then 'pago'::text
            when 'used'::text then 'pago'::text
            when 'expired'::text then 'pago'::text
            when 'pending'::text then 'pending'::text
            when 'cancelled'::text then 'cancelado'::text
            else g.status
        end as status,
    null::uuid as experience_id,
    'Gift Card'::text ||
        case
            when g.code is not null and g.code <> ''::text then ' '::text || g.code
            else ''::text
        end as experience_name,
    0 as payout_centavos,
    null::text as supplier_name,
    null::text as payout_status,
    g.comprador_email as customer_email,
    coalesce(g.comprador_nome, ''::text) as customer_name,
    null::text as category_slug,
    null::text as description,
    coalesce(g.valor_inicial_centavos, 0) as gross_centavos,
    0 as discount_centavos,
    false as is_test,
    g.id::text as group_id,
    1 as quantity
   from gift_cards g;

grant select on public.v_financial_ledger to authenticated, service_role;


-- ===== 2. financial_summary: contadores de volume viram sum(quantity) =====
-- Idêntica à de produção, exceto qbp/qmp/qgp.
create or replace function public.financial_summary(
  p_date_from   timestamp with time zone default null,
  p_date_to     timestamp with time zone default null,
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
stable
as $function$
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
      -- AGORA conta PARTICIPANTES/VAGAS (sum quantity), não transações.
      -- Manual: quantity só existe na 1ª parcela, então somar já dá
      -- os participantes uma vez por venda com entrada paga.
      coalesce(sum(quantity) filter (where source = 'booking'     and status = 'pago'), 0) as qbp,
      coalesce(sum(quantity) filter (where source = 'manual_sale' and status = 'pago'), 0) as qmp,
      coalesce(sum(quantity) filter (where source = 'giftcard'    and status = 'pago'), 0) as qgp,
      count(*) filter (where source = 'expense')                                          as qex
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
$function$;

grant execute on function public.financial_summary(timestamp with time zone, timestamp with time zone, uuid, text, text[], boolean)
  to authenticated, service_role;


notify pgrst, 'reload schema';
