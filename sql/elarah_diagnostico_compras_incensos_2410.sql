-- =============================================================
-- ELARAH — DIAGNÓSTICO: o que os compradores de
-- "Faça Seus Incensos Naturais" (24/10, manhã e tarde) veem na
-- aba "Minhas compras" (/conta.html?section=compras)
-- -------------------------------------------------------------
-- Somente SELECT — não altera nada. Rode no SQL Editor.
--
-- Contexto do que o card renderiza (conta.js → renderBookingCard):
--   título   = bookings.experiencia_nome
--   status   = bookings.status  (pago → "Confirmada")
--   📅       = bookings.data       (rótulo texto, ex.: "24/10")
--   ⏱        = bookings.horario    (rótulo texto, ex.: "10h00 – 13h00")
--   preço    = bookings.preco_label  (UNITÁRIO; só cai em
--              amount_total quando preco_label é nulo)
--   📍       = metadata->>'endereco' — metadata->>'bairro'
--              (CONGELADO na compra, copiado de experiences.*)
--   prazo    = metadata->>'politica_remarcacao_horas' (default 48h)
--
-- O endereço NÃO vem do slot (experience_slots não tem endereço),
-- então manhã e tarde carregam o mesmo valor — salvo se alguém
-- editou experiences.endereco ENTRE uma compra e outra.
-- =============================================================

-- ===== 1. O que está congelado em cada reserva (o que o cliente vê) =====
select
  b.id,
  b.email,
  b.nome,
  b.status,
  b.data                                      as data_card,
  b.horario                                   as horario_card,
  b.preco_label                               as preco_card,
  b.amount_total                              as total_pago_centavos,
  b.metadata->>'endereco'                     as endereco_card,
  b.metadata->>'bairro'                       as bairro_card,
  coalesce(b.metadata->>'endereco','')
    || case when nullif(b.metadata->>'bairro','') is not null
            then ' — ' || (b.metadata->>'bairro') else '' end
                                              as linha_local_renderizada,
  b.metadata->>'politica_remarcacao_horas'    as prazo_remarcacao_horas,
  b.created_at
from public.bookings b
where b.experiencia_nome ilike '%incenso%'
  and b.data like '24/10%'
order by b.horario, b.created_at;

-- ===== 2. Endereço ATUAL da experiência (compare com o congelado) =====
-- Divergência aqui = quem comprou antes da edição vê o endereço antigo.
select
  e.id,
  e.nome,
  e.endereco,
  e.bairro,
  e.is_active,
  e.updated_at
from public.experiences e
where e.nome ilike '%incenso%';

-- ===== 3. Slots de 24/10 (confirma manhã × tarde) =====
select
  s.id, s.data, s.horario, s.vagas_total, s.vagas_restantes,
  s.event_at, s.is_active
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where e.nome ilike '%incenso%'
  and (s.data like '24/10%' or s.event_at::date = date '2026-10-24')
order by s.event_at nulls last, s.horario;

-- ===== 4. Vendas manuais do mesmo dia =====
-- ATENÇÃO: o card de venda manual (renderManualSaleCard) NÃO mostra
-- endereço — quem entrou por aqui não vê a linha 📍 nenhuma.
select
  ms.id, ms.customer_name, ms.customer_email,
  ms.experience_name, ms.slot_date, ms.slot_time,
  ms.quantity, ms.total_amount_centavos, ms.payment_status
from public.manual_sales ms
where ms.experience_name ilike '%incenso%'
  and ms.slot_date = date '2026-10-24'
order by ms.slot_time, ms.created_at;
