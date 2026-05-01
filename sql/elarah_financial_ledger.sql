-- =============================================================
-- ELARAH — Livro-caixa unificado + RPC de resumo financeiro
-- -------------------------------------------------------------
-- View v_financial_ledger normaliza 3 fontes em uma estrutura única:
--   - bookings        (receita do site)        source = 'booking'
--   - manual_sales    (receita fora do site)   source = 'manual_sale'
--   - financial_expenses (despesas)            source = 'expense'
--
-- A view NÃO duplica dados — é uma projeção em runtime. Filtros e
-- agregados na UI consultam a view (ou a RPC abaixo, mais rápida).
--
-- RPC financial_summary(...) entrega os 7 cards do dashboard num
-- único round-trip. Aceita filtros opcionais de período/experiência/
-- fornecedor. Tudo em centavos (mesma convenção do projeto).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: bookings, manual_sales, financial_expenses,
--             public.is_admin().
-- =============================================================

-- ===== VIEW v_financial_ledger =====
create or replace view public.v_financial_ledger as
-- Bookings: cada reserva vira 1 linha. amount_total já é o que cliente
-- pagou em centavos (líquido de cupom). status mapeia direto.
select
  b.id::text                                          as id,
  'booking'::text                                     as source,
  'income'::text                                      as kind,
  b.created_at                                        as occurred_at,
  coalesce(b.amount_total, 0)                         as amount_centavos,
  b.status                                            as status,                      -- pending|pago|cancelado|expirado|reembolsado
  b.experiencia_id                                    as experience_id,
  b.experiencia_nome                                  as experience_name,
  -- Repasse total: soma da snapshot bookings.repasses (jsonb) se
  -- existir; senão, usa o legado valor_repasse_centavos.
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

-- Vendas manuais: total_amount_centavos é o líquido cobrado (já
-- considerando discount_centavos). Repasse vem dos campos inline.
select
  ms.id::text                                         as id,
  'manual_sale'::text                                 as source,
  'income'::text                                      as kind,
  ms.created_at                                       as occurred_at,
  coalesce(ms.total_amount_centavos, 0)               as amount_centavos,
  ms.payment_status                                   as status,                      -- pago|pendente|cancelado|reembolsado
  ms.experience_id                                    as experience_id,
  ms.experience_name                                  as experience_name,
  coalesce(ms.payout_amount_centavos, 0)              as payout_centavos,
  ms.supplier_name                                    as supplier_name,
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

union all

-- Despesas: amount_centavos com sinal positivo (consumidor da view
-- distingue por kind='expense' e source='expense').
select
  fe.id::text                                         as id,
  'expense'::text                                     as source,
  'expense'::text                                     as kind,
  (fe.expense_date::timestamptz)                      as occurred_at,
  coalesce(fe.amount_centavos, 0)                     as amount_centavos,
  fe.status                                           as status,                      -- pago|pendente|reembolsado|cancelado
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
left join public.financial_categories fc on fc.id = fe.category_id;

-- View herda RLS das tabelas-fonte (com security_invoker padrão).
-- Permissão de leitura via grant (RLS de cada tabela já restringe).
grant select on public.v_financial_ledger to authenticated, service_role;

-- ===== RPC financial_summary =====
-- Retorna os agregados que alimentam os 7 cards do dashboard
-- num único round-trip. Filtros opcionais: período (date_from/
-- date_to), experiência, fornecedor (chave normalizada).
--
-- Receita confirmada     = bookings status='pago'      + manual_sales status='pago'
-- Receita pendente       = bookings status='pending'   + manual_sales status='pendente'
-- Receita cancelada      = bookings status in ('cancelado','expirado') + manual_sales status='cancelado'
-- Receita reembolsada    = status='reembolsado' das duas
-- Gastos pagos / pendentes  = financial_expenses por status
-- Repasses pendentes     = soma de payout_centavos onde payout_status='repasse_pendente'
--                          das duas fontes de receita confirmada
-- Lucro estimado         = receita confirmada − gastos pagos − repasses (todos)
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
      sum(case when source in ('booking','manual_sale')
                and status in ('pago')                                then amount_centavos else 0 end) as rc,
      sum(case when source in ('booking','manual_sale')
                and status in ('pending','pendente')                  then amount_centavos else 0 end) as rp,
      sum(case when source in ('booking','manual_sale')
                and status in ('cancelado','expirado')                then amount_centavos else 0 end) as rcanc,
      sum(case when source in ('booking','manual_sale')
                and status = 'reembolsado'                            then amount_centavos else 0 end) as rref,
      sum(case when source = 'expense' and status = 'pago'            then amount_centavos else 0 end) as gp,
      sum(case when source = 'expense' and status = 'pendente'        then amount_centavos else 0 end) as gpe,
      sum(case when source in ('booking','manual_sale')
                and status = 'pago'
                and payout_status = 'repasse_pendente'                then payout_centavos else 0 end) as rpp,
      sum(case when source in ('booking','manual_sale')
                and status = 'pago'
                and payout_status = 'repasse_feito'                   then payout_centavos else 0 end) as rpf,
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
    -- Lucro estimado: receita confirmada − gastos pagos − repasses (pagos+pendentes,
    -- pois ambos saem do bolso da Elarah em algum momento).
    (coalesce(rc,0) - coalesce(gp,0) - coalesce(rpp,0) - coalesce(rpf,0))::bigint,
    coalesce(qbp,   0)::integer,
    coalesce(qmp,   0)::integer,
    coalesce(qex,   0)::integer
  from recs;
$$;

-- RPC stable + security invoker → respeita RLS do chamador (admin).
grant execute on function public.financial_summary(timestamptz, timestamptz, uuid, text)
  to authenticated, service_role;

-- ===== RPC financial_by_experience =====
-- Resultado financeiro por experiência (alimenta tabela "Resultado
-- por Experiência"). Cada linha = 1 experiência com receita, gastos,
-- repasses e lucro estimado.
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
      and experience_id is not null
  )
  select
    l.experience_id,
    coalesce(max(l.experience_name), '')::text                                    as experience_name,
    count(*) filter (where source = 'booking'     and status = 'pago')::int       as qty_site,
    count(*) filter (where source = 'manual_sale' and status = 'pago')::int       as qty_manual,
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
