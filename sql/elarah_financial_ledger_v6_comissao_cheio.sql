-- =============================================================
-- ELARAH — financial_by_supplier v6: comissão sobre o VALOR CHEIO
-- -------------------------------------------------------------
-- Ajuste único: a "Receita Elarah" (comissão) por fornecedor passa a ser
--   comissão = VALOR CHEIO − repasse total
-- em vez de
--   comissão = RECEITA (o que o cliente pagou) − repasse total.
--
-- Motivo: a aba Fornecedores mostrava a comissão menor quando o cliente
-- pagou menos que o valor cheio (preço antigo, cupom ou gift card). Ex:
-- valor cheio R$150, repasse R$105 → a comissão deve ser R$45 (30% do
-- cheio), mas aparecia R$30 quando a receita registrada era R$135.
-- Agora a comissão espelha a lista de reservas (valor cheio − repasse) e
-- as duas telas batem.
--
-- ⚠️ Efeito colateral consciente: quando há desconto REAL (cupom/gift),
-- a comissão passa a refletir o cheio, não o dinheiro líquido que entrou.
-- Se um dia quiser separar "margem teórica" de "margem realizada", dá pra
-- ter as duas colunas — mas hoje a regra pedida é: comissão = 30% do cheio.
--
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez). Só
-- substitui a função; não altera dados de reservas.
-- =============================================================

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
      b.valor_comissao_centavos
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
           supplier_name, payout_centavos, (ord = 1) as is_principal
    from bk_repasses
    union all
    select id, created_at, gross_centavos, receita_centavos, payout_status,
           supplier_name, payout_centavos, is_principal
    from bk_legacy
  ),
  bk_norm as (
    select
      lower(regexp_replace(coalesce(supplier_name,''), '\s+', ' ', 'g')) as supplier_key,
      supplier_name,
      'booking'::text                                                as source,
      id, created_at, gross_centavos, receita_centavos, payout_status,
      payout_centavos, is_principal
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
      coalesce(ms.payout_amount_centavos, 0)::bigint                 as payout_centavos
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
      payout_centavos,
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
    count(*)::int                                                    as qty_reservas,
    count(*) filter (where source = 'booking')::int                  as qty_bookings,
    count(*) filter (where source = 'manual_sale')::int              as qty_manual,
    sum(gross_centavos)::bigint                                      as faturamento_centavos,
    sum(receita_centavos)::bigint                                    as receita_centavos,
    sum(payout_centavos)::bigint                                     as repasse_total_centavos,
    sum(case when payout_status = 'repasse_pendente' then payout_centavos else 0 end)::bigint
                                                                     as repasse_pendente_centavos,
    sum(case when payout_status = 'repasse_feito'    then payout_centavos else 0 end)::bigint
                                                                     as repasse_pago_centavos,
    -- Comissão (margem Elarah por fornecedor) = VALOR CHEIO − TODOS os
    -- repasses da booking. Só conta na linha "principal" pra não duplicar
    -- em multi-fornecedor. (v6: era receita_centavos; agora gross_centavos
    -- pra bater com a lista de reservas — comissão = cheio − repasse.)
    sum(case when is_principal
             then gross_centavos - total_payouts_centavos
             else 0 end)::bigint                                     as comissao_centavos,
    max(created_at)                                                  as ultima_venda
  from with_total_payouts
  group by supplier_key
  order by faturamento_centavos desc nulls last;
$$;

grant execute on function public.financial_by_supplier(timestamptz, timestamptz, boolean)
  to authenticated, service_role;
