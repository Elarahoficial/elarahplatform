-- =============================================================
-- ELARAH — Financial Ledger v5: unificação total
-- -------------------------------------------------------------
-- Objetivo: tornar v_financial_ledger + RPCs a fonte ÚNICA de
-- verdade do financeiro. As abas Compras, Fornecedores e Analytics
-- vão consumir as RPCs daqui pra frente.
--
-- Mudanças aditivas em cima de v4 (elarah_financial_ledger_v4_giftcards.sql):
--   1. public.experiences  ganha coluna is_test (flag de auditoria)
--      + backfill por nome ('teste', 'teste 1').
--   2. v_financial_ledger ganha 3 colunas:
--      - gross_centavos      = preço de tabela (antes de cupom/giftcard)
--      - discount_centavos   = cupom + gift card aplicados
--      - is_test             = veio de experiência marcada como teste
--   3. financial_summary aceita 2 novos parâmetros:
--      - p_sources       text[]   (filtra por origem; null = todas)
--      - p_include_test  boolean  (default false — exclui teste)
--      Retorna 2 colunas adicionais: gross_centavos, discount_centavos.
--   4. nova RPC financial_by_supplier para a aba Fornecedores.
--      Substitui o agregador JS que duplica em casos multi-fornecedor.
--      Cada fornecedor vê suas próprias bookings; totais GLOBAIS
--      seguem vindo de financial_summary (dedupe automático).
--   5. nova RPC financial_evolution para o gráfico do Analytics
--      (bucketização por dia/hora no SQL, removendo cálculo JS).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- REVERSÍVEL: rodar elarah_financial_ledger_v4_giftcards.sql desfaz
--             a view + RPC; a coluna is_test pode ficar (não atrapalha).
-- =============================================================


-- ===== 1. experiences.is_test (flag de auditoria) =====
-- Default false. Backfill por nome legacy ('teste', 'teste 1') —
-- o array hardcoded em admin.js TEST_EXPERIENCE_NAMES vai ser
-- deprecado depois que o admin parar de filtrar por nome.
alter table public.experiences
  add column if not exists is_test boolean not null default false;

update public.experiences
   set is_test = true
 where is_test = false
   and lower(coalesce(nome, '')) in ('teste', 'teste 1');

create index if not exists experiences_is_test_idx
  on public.experiences (is_test) where is_test = true;


-- ===== 2. v_financial_ledger v5 =====
-- IMPORTANTE: a ordem das colunas existentes (v4) é PRESERVADA.
-- PostgreSQL só permite ADICIONAR colunas no FINAL via CREATE OR
-- REPLACE VIEW — qualquer reordenação dispara erro 42P16.
create or replace view public.v_financial_ledger as

-- Bookings: gross = valor_cheio (preço de tabela, antes de desconto).
-- Fallback: amount_total + cupom + gift_card (reconstrói o gross em
-- bookings antigas que não tinham valor_cheio_centavos preenchido).
-- discount = cupom + gift_card (centavos efetivamente abatidos).
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
  -- NOVAS COLUNAS (sempre no final):
  coalesce(
    b.valor_cheio_centavos,
    coalesce(b.amount_total, 0)
      + coalesce(b.coupon_discount_centavos, 0)
      + coalesce(b.gift_card_centavos, 0)
  )                                                   as gross_centavos,
  (coalesce(b.coupon_discount_centavos, 0)
   + coalesce(b.gift_card_centavos, 0))               as discount_centavos,
  -- is_test: nome legado OU flag explícita na experiência.
  (lower(coalesce(b.experiencia_nome, '')) in ('teste', 'teste 1')
   or coalesce(eb.is_test, false))                    as is_test
from public.bookings b
left join public.experiences eb on eb.id = b.experiencia_id

union all

-- Vendas manuais
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
  -- NOVAS COLUNAS:
  (coalesce(ms.total_amount_centavos, 0)
   + coalesce(ms.discount_centavos, 0))               as gross_centavos,
  coalesce(ms.discount_centavos, 0)                   as discount_centavos,
  coalesce(ems.is_test, false)                        as is_test
from public.manual_sales ms
left join public.experiences ems on ems.id = ms.experience_id

union all

-- Despesas
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
  -- NOVAS COLUNAS:
  coalesce(fe.amount_centavos, 0)                     as gross_centavos,
  0                                                   as discount_centavos,
  coalesce(efe.is_test, false)                        as is_test
from public.financial_expenses fe
left join public.financial_categories fc on fc.id = fe.category_id
left join public.experiences efe on efe.id = fe.experience_id

union all

-- Gift Cards
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
  -- NOVAS COLUNAS:
  coalesce(g.valor_inicial_centavos, 0)               as gross_centavos,
  0                                                   as discount_centavos,
  false                                               as is_test
from public.gift_cards g;

grant select on public.v_financial_ledger to authenticated, service_role;


-- ===== 3. financial_summary v3 =====
-- Adiciona 2 parâmetros (p_sources, p_include_test) e 2 colunas
-- de retorno (gross/discount). Drop+create porque mudou assinatura.
drop function if exists public.financial_summary(timestamptz, timestamptz, uuid, text);

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
  -- Novos campos: GMV (preço de tabela) e desconto aplicado.
  -- Só faz sentido para receita confirmada — espelham receita_confirmada
  -- mas em escala bruta, pra alimentar o card "Faturamento bruto" da
  -- aba Fornecedores e o relatório de cupons.
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
      -- GMV / desconto da receita confirmada
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'pago'                                  then gross_centavos else 0 end)    as gross_c,
      sum(case when source in ('booking','manual_sale','giftcard')
                and status = 'pago'                                  then discount_centavos else 0 end) as disc_c,
      count(*) filter (where source = 'booking'     and status = 'pago')      as qbp,
      count(*) filter (where source = 'manual_sale' and status = 'pago')      as qmp,
      count(*) filter (where source = 'giftcard'    and status = 'pago')      as qgp,
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
    -- Lucro estimado: receita confirmada − gastos pagos − repasses (pagos+pendentes)
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


-- ===== 4. financial_by_supplier =====
-- Agregação por fornecedor que substitui o loop JS de admin.js.
--
-- Tratamento multi-fornecedor: cada fornecedor que aparece em
-- bookings.repasses[] vê a booking como sua e contabiliza
-- proporcionalmente. Quando a aba Fornecedores soma o resultado pra
-- mostrar totais globais, o JS agora deve PEDIR os totais a
-- financial_summary (que dedupe sozinho), NÃO somar as linhas.
--
-- Cada linha:
--   - reservas       = nº de bookings/manual_sales onde o fornecedor é parte
--   - faturamento    = gross atribuído (valor_cheio dessas bookings)
--   - repasse_total  = valor_centavos do fornecedor em repasses[] / payout_amount
--   - repasse_pago / pendente conforme status_fornecedor / payout_status
--   - comissao       = (gross - repasse_total) atribuído ao fornecedor principal
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
      0::int                                                         as ord
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
    -- Comissão (margem Elarah por fornecedor): receita líquida −
    -- TODOS os repasses dessa booking. Só conta na linha "principal"
    -- pra não duplicar em multi-fornecedor.
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


-- ===== 5. financial_evolution (gráfico do Analytics) =====
-- Bucketização por dia ou hora, no SQL. Devolve uma série temporal
-- de receita confirmada + qty de vendas pra alimentar o gráfico
-- da aba Analytics. Hora vs dia controlado por p_bucket.
create or replace function public.financial_evolution(
  p_date_from    timestamptz default null,
  p_date_to      timestamptz default null,
  p_sources      text[]      default null,
  p_include_test boolean     default false,
  p_bucket       text        default 'day'      -- 'day' ou 'hour'
)
returns table (
  bucket_at        timestamptz,
  receita_centavos bigint,
  qty              integer
)
language sql
security invoker
stable
as $$
  with l as (
    select *
    from public.v_financial_ledger
    where kind = 'income'
      and status = 'pago'
      and (p_date_from is null or occurred_at >= p_date_from)
      and (p_date_to   is null or occurred_at <= p_date_to)
      and (p_sources   is null or source = any(p_sources))
      and (p_include_test = true or is_test = false)
  )
  select
    case when p_bucket = 'hour'
         then date_trunc('hour', occurred_at)
         else date_trunc('day',  occurred_at)
    end                                                              as bucket_at,
    sum(amount_centavos)::bigint                                     as receita_centavos,
    count(*)::int                                                    as qty
  from l
  group by 1
  order by 1;
$$;

grant execute on function public.financial_evolution(timestamptz, timestamptz, text[], boolean, text)
  to authenticated, service_role;


-- Recarrega o cache de schema do PostgREST (RPCs novas ficam visíveis).
notify pgrst, 'reload schema';
