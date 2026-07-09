-- =============================================================
-- ELARAH — financial_by_supplier volta a contar PESSOAS (vagas)
-- -------------------------------------------------------------
-- BUG corrigido aqui:
--   O contador da aba "Fornecedores" mostrava um número MENOR que o
--   real (ex: Ateliê 94 em vez de 143; um aniversário de 15 pessoas
--   contava como 1).
--
-- Causa: a correção `elarah_contadores_por_quantidade.sql` já havia
--   trocado a contagem de `count(*)` (nº de reservas) para
--   `sum(quantidade)` (nº de pessoas/vagas). Mas as atualizações de
--   comissão seguintes (v6 → v7 → v8) redefiniram a MESMA função
--   `financial_by_supplier` com `create or replace` e, sem querer,
--   voltaram a usar `count(*)` — revertendo a contagem por pessoa.
--
-- Este arquivo reaplica a lógica de comissão da v8 (comissão pela
--   config da experiência, padrão 20% do valor cheio) MANTIDA, e só
--   volta os contadores qty_* para `sum(quantidade)`:
--     qty_reservas  = pessoas totais (bookings + manuais)
--     qty_bookings  = pessoas de reservas do site
--     qty_manual    = pessoas de vendas manuais
--   Faturamento, receita, repasses e comissão NÃO mudam.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Como aplicar: Supabase -> SQL Editor -> cola -> Run.
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
      b.valor_comissao_centavos,
      e.comissao_type                                               as comm_type,
      e.comissao_value                                              as comm_value,
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
      bk.id, bk.created_at, bk.gross_centavos, bk.receita_centavos, bk.payout_status,
      bk.comm_type, bk.comm_value, bk.quantity,
      trim((elem->>'fornecedor_nome'))                              as supplier_name,
      coalesce((elem->>'valor_centavos')::bigint, 0)                as payout_centavos,
      false as is_principal, 0::int as ord
    from bk
    cross join lateral jsonb_array_elements(bk.repasses) with ordinality as t(elem, ord)
    where bk.repasses is not null
      and jsonb_typeof(bk.repasses) = 'array'
      and jsonb_array_length(bk.repasses) > 0
  ),
  bk_legacy as (
    select
      bk.id, bk.created_at, bk.gross_centavos, bk.receita_centavos, bk.payout_status,
      bk.comm_type, bk.comm_value, bk.quantity,
      trim(bk.fornecedor_nome)                                       as supplier_name,
      coalesce(bk.valor_repasse_centavos, 0)::bigint                 as payout_centavos,
      true as is_principal, 1::int as ord
    from bk
    where bk.repasses is null
       or jsonb_typeof(bk.repasses) <> 'array'
       or jsonb_array_length(bk.repasses) = 0
  ),
  bk_all as (
    select id, created_at, gross_centavos, receita_centavos, payout_status,
           comm_type, comm_value, quantity, supplier_name, payout_centavos, (ord = 1) as is_principal
    from bk_repasses
    union all
    select id, created_at, gross_centavos, receita_centavos, payout_status,
           comm_type, comm_value, quantity, supplier_name, payout_centavos, is_principal
    from bk_legacy
  ),
  bk_norm as (
    select
      lower(regexp_replace(coalesce(supplier_name,''), '\s+', ' ', 'g')) as supplier_key,
      supplier_name, 'booking'::text as source,
      id, created_at, gross_centavos, receita_centavos, payout_status,
      comm_type, comm_value, payout_centavos, quantity, is_principal
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
      ems.comissao_type                                              as comm_type,
      ems.comissao_value                                             as comm_value,
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
      supplier_name, 'manual_sale'::text as source,
      id, created_at, gross_centavos, receita_centavos, payout_status,
      comm_type, comm_value, payout_centavos, quantity,
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
    select u.*, sum(payout_centavos) over (partition by id) as total_payouts_centavos
    from unioned u
  )
  select
    supplier_key,
    (array_agg(supplier_name order by created_at desc))[1]           as supplier_name,
    -- CONTA PESSOAS/VAGAS (sum quantidade), não nº de reservas.
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
    -- Comissão (margem Elarah por fornecedor) pela CONFIG da experiência.
    -- Só conta na linha "principal" pra não duplicar em multi-fornecedor.
    --   percent → % do valor cheio ; fixed → centavos ; senão → PADRÃO 20%.
    sum(case when is_principal then
          case
            when comm_type = 'percent' and comm_value is not null
              then round(gross_centavos * (comm_value / 100.0))
            when comm_type = 'fixed' and comm_value is not null
              then round(comm_value)
            -- Sem comissão cadastrada → PADRÃO ELARAH = 20% do valor cheio.
            else round(gross_centavos * 0.20)
          end
        else 0 end)::bigint                                          as comissao_centavos,
    max(created_at)                                                  as ultima_venda
  from with_total_payouts
  group by supplier_key
  order by faturamento_centavos desc nulls last;
$$;

grant execute on function public.financial_by_supplier(timestamptz, timestamptz, boolean)
  to authenticated, service_role;

notify pgrst, 'reload schema';
