-- =============================================================
-- ELARAH — Correção: Receita Elarah (comissão) errada no cartão
-- -------------------------------------------------------------
-- A aba Fornecedores mostrava a "Receita Elarah" (comissão) e o
-- "Desconto" errados quando a venda era no cartão. Eram DOIS bugs
-- somados na RPC financial_by_supplier:
--
-- BUG 1 — comissão das vendas com repasses[] jogada fora
--   O trecho que explode repasses[] marca o "principal" (quem recebe a
--   comissão) por ord = 1, mas o v5 fixava `0::int as ord` na mão,
--   sobrescrevendo a ordinality do lateral join. Com ord sempre 0,
--   NENHUM fornecedor era principal nas vendas com repasses[] (todo
--   cartão) → a comissão dessas vendas virava R$0. Só as vendas antigas
--   (PIX/legado, sem repasses[]) contavam. Numa venda de R$300 = cartão
--   + PIX, a Receita Elarah saía R$30 em vez de R$60.
--   Correção: usar t.ord (a numeração real do array).
--
-- BUG 2 — a taxa do cartão inflava a receita/comissão
--   A RPC usava receita = amount_total (o valor pago). No cartão a taxa
--   é cobrada POR CIMA do preço, do cliente (regra da Elarah: "a taxa eu
--   passo pra pessoa"). Logo amount_total já vem inflado pela taxa, e a
--   taxa vazava pra dentro da comissão / distorcia o desconto.
--
-- MODELO CORRETO (confirmado com a operação)
--   valor cheio = preço do fornecedor (ex.: R$150)
--   Elarah dá 10% de desconto ao cliente → vende por R$135
--   Do valor cheio:  fornecedor 70% (R$105) · Elarah 20% (R$30)
--                    · desconto ao cliente 10% (R$15)
--   No cartão a taxa vai por cima (cliente paga ~R$142) e NÃO é receita
--   da Elarah — é repassada à adquirente.
--
-- IDENTIDADE CONTÁBIL (já documentada em elarah_financial_selfcheck.sql):
--       valor_cheio − amount_total = desconto − card_fee
--   ⇒   amount_total − card_fee     = valor_cheio − desconto
--       = preço real com desconto, SEM a taxa.
--   É esse valor que a comissão e o desconto devem usar.
--
-- CORREÇÃO
--   receita_centavos passa a ser  amount_total − card_fee, onde
--   card_fee = metadata->>'card_fee_total_centavos' (0 no PIX / vendas
--   sem taxa). Com isso, DE UMA VEZ:
--     - comissão (= receita − repasse) deixa de comer a taxa;
--     - a coluna "Desconto" (faturamento − receita, no admin.js)
--       passa a mostrar o desconto REAL ao cliente (o 10%).
--
--   Exemplo (2 vendas de R$150, uma no cartão outra no PIX):
--     antes:  Receita Elarah R$30 · Desconto R$22,93
--     depois: Receita Elarah R$60 · Desconto R$30,00
--
-- ESCOPO: só bookings (cartão/PIX). Vendas manuais não têm taxa de
--   cartão, ficam inalteradas. A assinatura e as colunas de retorno da
--   RPC são idênticas — nada mais precisa mudar no front.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- REVERSÍVEL: rodar elarah_financial_ledger_v5_unified.sql restaura a
--   versão anterior da função.
-- =============================================================

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
  -- Bookings pagas no período (não-teste por default), expandidas por
  -- fornecedor: 1 linha por entrada de repasses[]. Bookings antigas
  -- sem repasses[] caem no fallback {fornecedor_nome, valor_repasse_centavos}.
  bk as (
    select
      b.id,
      b.created_at,
      coalesce(b.valor_cheio_centavos,
        coalesce(b.amount_total,0)
          + coalesce(b.coupon_discount_centavos,0)
          + coalesce(b.gift_card_centavos,0))                       as gross_centavos,
      -- Receita SEM a taxa do cartão: amount_total − card_fee.
      -- No cartão a taxa é cobrada por cima, do cliente, e não é
      -- receita da Elarah — então sai da conta. No PIX / vendas sem
      -- taxa, card_fee = 0 e receita = amount_total (inalterado).
      greatest(
        0,
        coalesce(b.amount_total, 0)
          - coalesce(round(nullif(b.metadata->>'card_fee_total_centavos','')::numeric)::bigint, 0)
      )                                                             as receita_centavos,
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
    -- 1ª preferência: explodir repasses[]
    select
      bk.id,
      bk.created_at,
      bk.gross_centavos,
      bk.receita_centavos,
      bk.payout_status,
      trim((elem->>'fornecedor_nome'))                              as supplier_name,
      coalesce((elem->>'valor_centavos')::bigint, 0)                as payout_centavos,
      false                                                          as is_principal,
      -- Numeração REAL do repasses[] (1 = principal). O v5 fixava isto
      -- em 0::int na mão, sobrescrevendo a ordinality e fazendo com que
      -- NENHUM fornecedor fosse "principal" nas vendas com repasses[]
      -- (todo cartão) — a comissão dessas vendas era descartada.
      t.ord::int                                                     as ord
    from bk
    cross join lateral jsonb_array_elements(bk.repasses) with ordinality as t(elem, ord)
    where bk.repasses is not null
      and jsonb_typeof(bk.repasses) = 'array'
      and jsonb_array_length(bk.repasses) > 0
  ),
  bk_legacy as (
    -- Fallback: bookings antigas sem repasses[]
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
    -- Marca o "principal" (ord=1) — recebe a comissão
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
  -- Manual sales pagas no período
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
      true as is_principal       -- vendas manuais têm 1 fornecedor, sempre "principal"
    from ms
    where coalesce(supplier_name,'') <> ''
  ),
  unioned as (
    select * from bk_norm
    union all
    select * from ms_norm
  ),
  -- Pré-calcula a soma de payouts por id (booking ou manual_sale).
  -- Necessário pra que a comissão não duplique em multi-fornecedor:
  -- a linha "principal" desconta o TOTAL de repasses, não só o seu.
  with_total_payouts as (
    select
      u.*,
      sum(payout_centavos) over (partition by id) as total_payouts_centavos
    from unioned u
  )
  select
    supplier_key,
    -- Pega o nome mais recente como representativo (snapshot mais novo)
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
    -- Comissão (margem Elarah por fornecedor): receita líquida (já SEM a
    -- taxa do cartão) − TODOS os repasses dessa booking. Só conta na
    -- linha "principal" pra não duplicar em multi-fornecedor.
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

-- Recarrega o cache de schema do PostgREST.
notify pgrst, 'reload schema';


-- =============================================================
-- CONFERÊNCIA (opcional) — rode pra ver o antes/depois por fornecedor.
-- A "comissao_nova" já sai sem a taxa; compare com o que a aba mostrava.
-- =============================================================
-- select supplier_name,
--        faturamento_centavos/100.0   as faturamento,
--        receita_centavos/100.0       as receita_sem_taxa,
--        repasse_total_centavos/100.0 as repasse,
--        comissao_centavos/100.0      as receita_elarah,
--        (faturamento_centavos - receita_centavos)/100.0 as desconto_cliente
--   from public.financial_by_supplier()
--  order by faturamento_centavos desc;
