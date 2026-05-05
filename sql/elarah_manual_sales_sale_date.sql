-- =============================================================
-- ELARAH — manual_sales: campo sale_date (data da venda)
-- -------------------------------------------------------------
-- Permite registrar a data em que a venda foi feita, separada
-- da data do evento (slot_date) e da data de cadastro (created_at).
-- Útil pra registrar vendas retroativas (venda feita semana passada,
-- cadastrada hoje).
--
-- Atualiza v_financial_ledger pra usar coalesce(sale_date, created_at)
-- no occurred_at — assim filtros de período ficam corretos pra
-- vendas registradas com data passada.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- 1. Adiciona a coluna (NULL = "ainda não setado", cai no fallback).
alter table public.manual_sales
  add column if not exists sale_date date;

-- 2. Backfill: vendas antigas usam o created_at como sale_date pra
--    não ficar NULL (e a view continuar dando occurred_at correto).
update public.manual_sales
   set sale_date = created_at::date
 where sale_date is null;

-- 3. Default pra novos inserts (current_date). Idempotente — drop+set.
alter table public.manual_sales
  alter column sale_date set default current_date;

-- 4. Índice pra filtros por período.
create index if not exists manual_sales_sale_date_idx
  on public.manual_sales (sale_date desc);

-- 5. View v3: occurred_at agora usa sale_date com fallback created_at.
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
  -- sale_date com fallback pra created_at (vendas antigas migradas).
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
left join public.financial_categories fc on fc.id = fe.category_id;

grant select on public.v_financial_ledger to authenticated, service_role;

notify pgrst, 'reload schema';
