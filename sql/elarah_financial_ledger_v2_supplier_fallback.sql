-- =============================================================
-- ELARAH — Financial Ledger v2: fallback de fornecedor via experiência
-- -------------------------------------------------------------
-- Atualiza a view v_financial_ledger pra que vendas manuais sem
-- supplier_name preenchido herdem o fornecedor cadastrado na
-- experiência (display only — não altera dados em manual_sales).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar. Substitui a view
-- da v1 (sql/elarah_financial_ledger.sql) sem efeito colateral nas
-- RPCs financial_summary e financial_by_experience, que continuam
-- consultando a view atualizada.
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

-- Vendas manuais: COALESCE no supplier_name pra puxar do fornecedor
-- cadastrado na experiência quando a venda não teve um snapshot salvo
-- (ex: vendas criadas antes do auto-fill, ou intencionalmente sem
-- payout). Display-only — manual_sales.supplier_name no DB segue NULL.
select
  ms.id::text                                         as id,
  'manual_sale'::text                                 as source,
  'income'::text                                      as kind,
  ms.created_at                                       as occurred_at,
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
