-- =====================================================================
-- BACKFILL DAS DATAS DE REPASSE
-- =====================================================================
-- Repasses marcados como "feito" ANTES do sistema passar a carimbar a
-- data ficaram sem data e por isso não entram em mês nenhum no extrato
-- (PDF por fornecedor) — aparecem no aviso "N repasse(s) ficaram fora".
--
-- Recuperação: bookings e manual_sales têm o trigger set_updated_at, que
-- atualiza updated_at a cada alteração da linha. Numa linha marcada como
-- repasse feito, esse updated_at é o momento em que o repasse foi
-- marcado — a melhor estimativa disponível, e bem melhor que created_at
-- (data da COMPRA), usado no backfill antigo.
--
-- Só preenche onde está NULL. Não sobrescreve data já registrada.
-- Aditivo e idempotente — seguro rodar mais de uma vez.
--
-- Efeito colateral: nas linhas tocadas, updated_at passa a ser "agora"
-- (o trigger dispara). Não afeta o extrato — desde o PR #562 o código
-- não usa mais updated_at pra decidir o mês.
--
-- Rode no SQL Editor do Supabase.
-- =====================================================================


-- =====================================================================
-- PARTE 1 — DIAGNÓSTICO (só leitura, não muda nada)
-- Rode sozinha primeiro e confira as datas da coluna "data_que_sera_usada".
-- =====================================================================

-- select
--   'reserva'                as origem,
--   b.nome                   as cliente,
--   b.experiencia_nome       as experiencia,
--   b.fornecedor_nome        as fornecedor,
--   b.created_at::date       as data_da_compra,
--   b.updated_at             as data_que_sera_usada
-- from public.bookings b
-- where b.status = 'pago'
--   and b.status_fornecedor = 'repasse_feito'
--   and b.repasse_feito_at is null
--
-- union all
--
-- select
--   'venda manual'           as origem,
--   m.customer_name          as cliente,
--   m.experience_name        as experiencia,
--   m.supplier_name          as fornecedor,
--   m.sale_date              as data_da_compra,
--   m.updated_at             as data_que_sera_usada
-- from public.manual_sales m
-- where m.payment_status = 'pago'
--   and m.payout_status  = 'pago'
--   and m.payout_paid_at is null
--
-- order by data_que_sera_usada;


-- =====================================================================
-- PARTE 2 — CORREÇÃO
-- Rode depois de conferir a PARTE 1.
-- =====================================================================

-- Garante a coluna (caso a migração elarah_bookings_repasse_feito_at.sql
-- nunca tenha sido rodada — é o motivo mais provável das datas faltando).
alter table public.bookings
  add column if not exists repasse_feito_at timestamptz;

-- 1) Reservas (bookings)
update public.bookings
   set repasse_feito_at = updated_at
 where status_fornecedor = 'repasse_feito'
   and repasse_feito_at is null;

-- 2) Vendas manuais — fornecedor principal
update public.manual_sales
   set payout_paid_at = updated_at
 where payout_status = 'pago'
   and payout_paid_at is null;

-- 3) Vendas manuais — fornecedores extras (array jsonb extra_payouts).
--    Preenche paid_at só nos itens pagos que estão sem data, preservando
--    a ordem do array e todos os outros campos de cada item.
update public.manual_sales m
   set extra_payouts = (
         select jsonb_agg(
                  case
                    when e->>'status' = 'pago' and (e->>'paid_at') is null
                      then e || jsonb_build_object(
                             'paid_at',
                             to_char(m.updated_at at time zone 'UTC',
                                     'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
                    else e
                  end
                  order by ord)
           from jsonb_array_elements(m.extra_payouts) with ordinality as t(e, ord)
       )
 where jsonb_typeof(m.extra_payouts) = 'array'
   and exists (
         select 1
           from jsonb_array_elements(m.extra_payouts) e
          where e->>'status' = 'pago'
            and (e->>'paid_at') is null
       );

notify pgrst, 'reload schema';


-- =====================================================================
-- PARTE 3 — CONFERÊNCIA (só leitura)
-- Depois da PARTE 2, os três números têm que vir ZERO.
-- =====================================================================

-- select
--   (select count(*) from public.bookings
--     where status_fornecedor = 'repasse_feito' and repasse_feito_at is null)
--     as reservas_sem_data,
--   (select count(*) from public.manual_sales
--     where payout_status = 'pago' and payout_paid_at is null)
--     as vendas_manuais_sem_data,
--   (select count(*) from public.manual_sales m
--     where jsonb_typeof(m.extra_payouts) = 'array'
--       and exists (select 1 from jsonb_array_elements(m.extra_payouts) e
--                    where e->>'status' = 'pago' and (e->>'paid_at') is null))
--     as extras_sem_data;
