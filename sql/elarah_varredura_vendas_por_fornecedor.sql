-- =============================================================
-- ELARAH — Varredura de vendas por fornecedor (conferência)
-- -------------------------------------------------------------
-- Objetivo: conferir se TODAS as compras até hoje estão sendo
-- contadas por fornecedora, e se GRUPOS (ex: aniversário de 15
-- pessoas) contam as 15 pessoas — e não 1.
--
-- Regra do contador do admin (mesma usada aqui):
--   conta PESSOAS/VAGAS (soma da quantidade), não nº de reservas.
--   O número que aparece na aba Fornecedores conta só as PAGAS.
--
-- Esta varredura mostra, lado a lado:
--   - pessoas_pagas        -> é o número que aparece hoje no admin
--   - pessoas_pendentes    -> reservou mas ainda não quitou (ex: só sinal)
--   - pessoas_canceladas   -> canceladas / reembolsadas / expiradas
--   - pessoas_total        -> soma de TUDO (o "de verdade até hoje")
--   - maior_grupo          -> a maior venda individual (confere se grupo
--                             grande está lá com o nº certo de pessoas)
--   - nomes_encontrados    -> se aparecer mais de um nome aqui, o nome
--                             da fornecedora está DIVIDIDO (acento/grafia)
--                             e a contagem se partiu em duas linhas.
--
-- É SÓ LEITURA. Não altera nada. Pode rodar à vontade.
-- Como rodar: Supabase -> SQL Editor -> cola -> Run.
-- =============================================================

-- Base unificada: reservas do site + vendas manuais, com a
-- quantidade de pessoas de cada venda e o status. Exclui teste.
with vendas as (
  -- Reservas feitas pelo site
  select
    b.fornecedor_nome                               as fornecedora,
    b.experiencia_nome                              as experiencia,
    b.created_at::date                              as data,
    greatest(coalesce(b.quantidade, 1), 1)          as pessoas,
    b.status                                        as status,
    'site'::text                                    as origem,
    b.nome                                          as cliente,
    (coalesce(eb.is_test, false)
      or lower(coalesce(b.experiencia_nome, '')) in ('teste', 'teste 1')) as is_test
  from public.bookings b
  left join public.experiences eb on eb.id = b.experiencia_id

  union all

  -- Vendas lançadas manualmente
  select
    coalesce(nullif(trim(ms.supplier_name), ''), ems.fornecedor_nome) as fornecedora,
    coalesce(ms.experience_name, ems.nome)          as experiencia,
    coalesce(ms.sale_date, ms.created_at::date)     as data,
    greatest(coalesce(ms.quantity, 1), 1)           as pessoas,
    ms.payment_status                               as status,
    'manual'::text                                  as origem,
    ms.customer_name                                as cliente,
    coalesce(ems.is_test, false)                    as is_test
  from public.manual_sales ms
  left join public.experiences ems on ems.id = ms.experience_id
)

-- =========== RESULTADO 1: resumo por fornecedora ===========
select
  lower(regexp_replace(trim(fornecedora), '\s+', ' ', 'g'))              as chave,
  string_agg(distinct fornecedora, '  |  ')                              as nomes_encontrados,
  coalesce(sum(pessoas) filter (where status = 'pago'), 0)              as pessoas_pagas,
  coalesce(sum(pessoas) filter (where status in ('pending','pendente')), 0)  as pessoas_pendentes,
  coalesce(sum(pessoas) filter (where status in ('cancelado','reembolsado','expirado')), 0) as pessoas_canceladas,
  coalesce(sum(pessoas), 0)                                              as pessoas_total,
  max(pessoas)                                                          as maior_grupo,
  count(*)                                                              as qtd_vendas
from vendas
where not is_test
  and coalesce(trim(fornecedora), '') <> ''
group by 1
order by pessoas_total desc;


-- =============================================================
-- RESULTADO 2 (opcional): lista todos os GRUPOS (4+ pessoas),
-- pra bater o olho e confirmar que cada grupo está com o número
-- certo de pessoas e no status certo.
-- Pra ver: selecione só o bloco abaixo (do "with" até o ";") e Run.
-- =============================================================
-- with vendas as (
--   select
--     b.fornecedor_nome as fornecedora, b.experiencia_nome as experiencia,
--     coalesce(b.created_at::date, b.data::date) as data,
--     greatest(coalesce(b.quantidade,1),1) as pessoas, b.status as status,
--     'site'::text as origem, b.nome as cliente,
--     (coalesce(eb.is_test,false) or lower(coalesce(b.experiencia_nome,'')) in ('teste','teste 1')) as is_test
--   from public.bookings b left join public.experiences eb on eb.id = b.experiencia_id
--   union all
--   select
--     coalesce(nullif(trim(ms.supplier_name),''), ems.fornecedor_nome), coalesce(ms.experience_name, ems.nome),
--     coalesce(ms.sale_date, ms.created_at::date), greatest(coalesce(ms.quantity,1),1), ms.payment_status,
--     'manual'::text, ms.customer_name, coalesce(ems.is_test,false)
--   from public.manual_sales ms left join public.experiences ems on ems.id = ms.experience_id
-- )
-- select data, fornecedora, experiencia, pessoas, status, origem, cliente
-- from vendas
-- where not is_test and coalesce(trim(fornecedora),'') <> '' and pessoas >= 4
-- order by pessoas desc, data desc;
