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
-- recurrence_rule_id É O CAMPO DECISIVO: se não for nulo, o slot é
-- gerido pela Recorrência semanal e o cadastro manual de horários
-- IGNORA ele de propósito (experiences-data.js:1482-1485) — editar o
-- horário no form da experiência não tem efeito nenhum.
select
  s.id,
  s.data,
  s.horario,
  s.vagas_total,
  s.vagas_restantes,
  s.event_at,
  s.event_at at time zone 'America/Sao_Paulo' as event_at_brt,
  s.recurrence_rule_id,
  s.is_active,
  s.updated_at
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where e.nome ilike '%incenso%'
  and (s.data like '24/10%' or s.event_at::date = date '2026-10-24')
order by s.event_at nulls last, s.horario;

-- ===== 3b. Horário CONGELADO nas reservas × horário do slot =====
-- bookings.horario é texto gravado na compra. Corrigir o slot NÃO
-- reescreve reserva nenhuma — quem já comprou continua vendo o rótulo
-- antigo na aba de compras. Toda linha em que os dois diferem é um
-- cliente vendo horário errado.
select
  b.id,
  b.email,
  b.nome,
  b.status,
  b.horario                as horario_que_o_cliente_ve,
  s.horario                as horario_atual_do_slot,
  (b.horario is distinct from s.horario) as divergente,
  b.metadata->>'endereco'  as endereco_que_o_cliente_ve
from public.bookings b
left join public.experience_slots s on s.id = b.slot_id
where b.experiencia_nome ilike '%incenso%'
  and b.data like '24/10%'
  and b.status in ('pago','pending')
order by b.horario, b.created_at;

-- ===== 3c. Origem do overbooking (vagas_restantes negativo) =====
-- decrement_slot_vagas nunca deixa negativar (recusa quando
-- restante < quantidade). Restante < 0 só vem de venda manual
-- registrada acima da lotação. Isto mostra a lotação real.
select
  s.horario,
  s.vagas_total,
  s.vagas_restantes,
  (select coalesce(sum(b.quantidade), 0) from public.bookings b
     where b.slot_id = s.id and b.status in ('pago','pending'))      as pessoas_pelo_site,
  (select coalesce(sum(ms.quantity), 0) from public.manual_sales ms
     where ms.slot_id = s.id and ms.payment_status in ('pago','pendente')) as pessoas_venda_manual
from public.experience_slots s
join public.experiences e on e.id = s.experience_id
where e.nome ilike '%incenso%'
  and (s.data like '24/10%' or s.event_at::date = date '2026-10-24')
order by s.horario;

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
