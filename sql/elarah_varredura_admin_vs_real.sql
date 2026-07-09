-- =============================================================
-- ELARAH — Contador do admin  ×  total REAL de pessoas pagas
-- -------------------------------------------------------------
-- Compara, por fornecedora:
--   no_admin    -> o número que a aba Fornecedores mostra hoje
--                  (vem da função financial_by_supplier)
--   real_pagas  -> o total real de pessoas PAGAS na base
--   diferenca   -> real_pagas - no_admin
--
-- Se "diferenca" for grande e positiva, o contador do admin está
-- deixando vendas de fora na exibição (provável: reservas com
-- `repasses` cujo nome do fornecedor está sem acento / grafia
-- diferente / em branco, jogando a venda pra outra linha).
--
-- Linhas que aparecem só do lado do admin (real_pagas = 0) são
-- justamente essas "linhas fantasma" com o nome quebrado.
--
-- É SÓ LEITURA. Supabase -> SQL Editor -> cola -> Run.
-- =============================================================

with raw as (
  select
    lower(regexp_replace(trim(fornecedora), '\s+', ' ', 'g')) as chave,
    sum(pessoas) filter (where status = 'pago')               as real_pagas
  from (
    select
      b.fornecedor_nome                          as fornecedora,
      greatest(coalesce(b.quantidade, 1), 1)     as pessoas,
      b.status                                   as status,
      (coalesce(eb.is_test, false)
        or lower(coalesce(b.experiencia_nome, '')) in ('teste', 'teste 1')) as is_test
    from public.bookings b
    left join public.experiences eb on eb.id = b.experiencia_id

    union all

    select
      coalesce(nullif(trim(ms.supplier_name), ''), ems.fornecedor_nome),
      greatest(coalesce(ms.quantity, 1), 1),
      ms.payment_status,
      coalesce(ems.is_test, false)
    from public.manual_sales ms
    left join public.experiences ems on ems.id = ms.experience_id
  ) v
  where not is_test
    and coalesce(trim(fornecedora), '') <> ''
  group by 1
)
select
  coalesce(r.supplier_name, raw.chave)                          as fornecedora,
  coalesce(r.qty_reservas, 0)                                   as no_admin,
  coalesce(raw.real_pagas, 0)                                   as real_pagas,
  coalesce(raw.real_pagas, 0) - coalesce(r.qty_reservas, 0)     as diferenca
from public.financial_by_supplier() r
full join raw on r.supplier_key = raw.chave
order by diferenca desc nulls last, real_pagas desc;
