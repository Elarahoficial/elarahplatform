-- =============================================================
-- ELARAH — Diagnóstico: "vagas vendidas" vs "reservas fechadas"
-- -------------------------------------------------------------
-- MOTIVO: o painel mostrou "5 vagas · 4 site / 1 manual", mas uma
-- venda foi de 3 pessoas num único fechamento + outras 3 no dia.
-- O esperado seria contar PARTICIPANTES (soma de quantidade), não
-- o número de reservas/compradores.
--
-- Este script é 100% SELECT (não altera nada). Ele responde de
-- forma definitiva QUAL das duas causas está em jogo:
--
--   CAUSA A — A migração sql/elarah_contadores_por_quantidade.sql
--             NÃO foi aplicada no Supabase. A RPC financial_summary
--             ainda usa count(*) (conta compradores), então 1
--             reserva de 3 pessoas conta como 1.
--
--   CAUSA B — A migração foi aplicada, MAS a reserva da moça está
--             com quantidade nula/1 (a quantidade não foi gravada
--             no fechamento), então mesmo somando quantidade dá 1.
--
-- Rode tudo de uma vez no SQL Editor do Supabase. Leia o comentário
-- acima de cada bloco pra saber o que o resultado significa.
-- =============================================================


-- =============================================================
-- BLOCO 1 — A RPC está contando COMPRADORES ou PARTICIPANTES?
-- -------------------------------------------------------------
-- Compara, para os MESMOS bookings pagos:
--   compradores      = count(*)          (1 por reserva)
--   participantes    = sum(quantidade)   (1 por vaga)
--   rpc_qty_bookings = o que a RPC devolve HOJE (o que o painel usa)
--
-- Interpretação:
--   • rpc_qty_bookings == compradores  E  participantes > compradores
--       -> CAUSA A. A migração de contadores NÃO foi aplicada.
--         Rode sql/elarah_contadores_por_quantidade.sql no Supabase.
--   • rpc_qty_bookings == participantes
--       -> A RPC já está correta. O "erro" está nos dados (ver Bloco 3)
--         ou na leitura do número — vá pro Bloco 2/3.
-- =============================================================
with base as (
  select
    count(*)                                         as compradores,
    coalesce(sum(greatest(coalesce(quantidade,1),1)), 0) as participantes
  from public.bookings
  where status = 'pago'
    and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1')
),
rpc as (
  select qty_bookings_pagos as rpc_qty_bookings
  from public.financial_summary(
    null, null, null, null,
    array['booking']::text[],   -- só bookings do site
    false                       -- exclui teste
  )
)
select
  b.compradores,
  b.participantes,
  r.rpc_qty_bookings,
  (b.participantes - b.compradores)                  as vagas_a_mais_que_reservas,
  case
    when r.rpc_qty_bookings = b.participantes
      then 'OK — RPC conta PARTICIPANTES (sum quantidade)'
    when r.rpc_qty_bookings = b.compradores and b.participantes > b.compradores
      then 'CAUSA A — RPC conta COMPRADORES. Rode elarah_contadores_por_quantidade.sql'
    when r.rpc_qty_bookings = b.compradores and b.participantes = b.compradores
      then 'RPC conta compradores, mas nenhum booking tem quantidade>1 (ver Bloco 3 = CAUSA B)'
    else 'INESPERADO — investigar manualmente'
  end                                                as diagnostico
from base b cross join rpc r;


-- =============================================================
-- BLOCO 2 — A view v_financial_ledger tem a coluna `quantity`?
-- -------------------------------------------------------------
-- A migração de contadores adiciona a coluna `quantity` na view
-- v_financial_ledger. Se ela NÃO existir, a migração definitivamente
-- não foi aplicada (confirma a CAUSA A).
-- =============================================================
select
  case when exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'v_financial_ledger'
      and column_name  = 'quantity'
  )
  then 'view TEM coluna quantity — migração aplicada'
  else 'view NÃO tem coluna quantity — CAUSA A: migração NÃO aplicada'
  end as status_migracao;


-- =============================================================
-- BLOCO 3 — Reservas pagas recentes, com quantidade explícita
-- -------------------------------------------------------------
-- Mostra cada fechamento recente com a quantidade gravada. Aqui
-- você localiza a reserva "de 3 pessoas": se a coluna quantidade
-- vier 3, o dado está certo (problema é só a contagem = Causa A).
-- Se vier 1 ou NULL numa reserva que foi de 3 pessoas, é CAUSA B
-- (a quantidade não foi capturada no checkout).
-- =============================================================
select
  id,
  created_at,
  nome                                               as comprador,
  experiencia_nome,
  quantidade                                         as quantidade_gravada,
  greatest(coalesce(quantidade,1),1)                 as vagas_contadas,
  (amount_total / 100.0)::numeric(14,2)              as valor_reais,
  status
from public.bookings
where status = 'pago'
  and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1')
order by created_at desc
limit 30;


-- =============================================================
-- BLOCO 4 — Vendas manuais pagas recentes, com quantity
-- -------------------------------------------------------------
-- Mesma checagem para a parte "manual" do contador.
-- =============================================================
select
  id,
  coalesce(sale_date::timestamptz, created_at)       as data,
  customer_name                                      as comprador,
  experience_name,
  quantity                                           as quantidade_gravada,
  greatest(coalesce(quantity,1),1)                   as vagas_contadas,
  (total_amount_centavos / 100.0)::numeric(14,2)     as valor_reais,
  payment_status
from public.manual_sales
where payment_status = 'pago'
order by coalesce(sale_date::timestamptz, created_at) desc
limit 30;


-- =============================================================
-- BLOCO 5 — Resumo lado a lado: reservas x vagas (site + manual)
-- -------------------------------------------------------------
-- O par que o painel deveria mostrar. "reservas_*" = quantos
-- fecharam; "vagas_*" = quantas pessoas no total. O painel deve
-- exibir as VAGAS.
-- =============================================================
select
  'site (bookings)'                                  as origem,
  count(*)                                           as reservas,
  coalesce(sum(greatest(coalesce(quantidade,1),1)),0) as vagas
from public.bookings
where status = 'pago'
  and lower(coalesce(experiencia_nome, '')) not in ('teste', 'teste 1')
union all
select
  'manual (manual_sales)'                            as origem,
  count(*)                                           as reservas,
  coalesce(sum(greatest(coalesce(quantity,1),1)),0)  as vagas
from public.manual_sales
where payment_status = 'pago';
