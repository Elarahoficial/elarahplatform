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

-- ===== 3d. Por que a tarde vendeu 6 em 4 lugares =====
-- vagas_restantes = -2 é o reconcile_all_vagas() (cron a cada 10min,
-- sql/elarah_vagas_sweep_reconcile_cron.sql) recomputando o ABSOLUTO:
-- vagas_total − pessoas ativas, sem piso. Ele reporta a verdade; o furo
-- aconteceu antes, no momento da compra. Três caminhos conhecidos:
--
--  (a) metadata.inventory_skipped = true — o guard não conseguiu
--      decrementar em nenhuma camada e DEIXOU a compra passar de
--      propósito (_shared/booking_guard.ts:1030-1040).
--  (b) erro de TRANSPORTE no RPC de decremento: o guard "assume
--      aplicado" e segue (booking_guard.ts:965-975). Se o UPDATE não
--      commitou, o contador não andou e o próximo cliente ainda viu
--      vaga livre. Não deixa flag no metadata — identifica-se pela
--      ordem: reservas 5 e 6 entrando depois das 4 primeiras.
--  (c) vagas_total reduzido DEPOIS das vendas (slot.updated_at
--      posterior ao created_at das reservas).
select
  b.created_at,
  b.email,
  b.status,
  b.quantidade,
  sum(b.quantidade) over (
    partition by b.slot_id order by b.created_at
    rows between unbounded preceding and current row
  )                                        as acumulado_de_pessoas,
  s.vagas_total,
  b.metadata->>'inventory_skipped'         as inventory_skipped,
  left(coalesce(b.stripe_session_id,''), 8) as via_pagamento,
  (b.metadata ? 'admin_edit_history')      as editada_no_admin,
  s.updated_at                             as slot_alterado_em
from public.bookings b
join public.experience_slots s on s.id = b.slot_id
join public.experiences e on e.id = s.experience_id
where e.nome ilike '%incenso%'
  and s.horario = '13h30 – 15h30'
  and b.status in ('pago','pending')
order by b.created_at;

-- Leitura: se `acumulado_de_pessoas` passa de vagas_total numa linha
-- SEM inventory_skipped, foi o caminho (b) — o decremento se perdeu.
-- Se todas as 6 são anteriores a slot_alterado_em, foi (c).

-- ===== 5. Três experiências com o mesmo nome (duas ATIVAS) =====
-- A query 2 devolveu 3 linhas pra "Faça seus Incensos Naturais".
-- Editar a cópia errada é a explicação mais simples pra uma alteração
-- de horário que "salva" e não aparece. Isto mostra qual cópia carrega
-- os slots de 24/10 e qual carrega as reservas — a que tem as duas é
-- a única que deve ser editada.
select
  e.id,
  e.nome,
  e.is_active,
  e.updated_at,
  (select count(*) from public.experience_slots s
     where s.experience_id = e.id)                       as slots,
  (select count(*) from public.experience_slots s
     where s.experience_id = e.id and s.data like '24/10%') as slots_2410,
  (select count(*) from public.bookings b
     where b.experiencia_id = e.id
       and b.status in ('pago','pending'))               as reservas_ativas
from public.experiences e
where e.nome ilike '%incenso%'
order by e.updated_at desc;

-- ===== 6. Rótulo do slot × rótulo que as clientes compraram =====
-- As reservas da manhã foram gravadas com "10h00 – 12h00" e o slot
-- vinculado diz "09h30 – 11h30". Quem manda no que a cliente vê é a
-- reserva; o rótulo do slot é o que o SITE mostra pra quem for comprar.
select
  s.id            as slot_id,
  s.horario       as rotulo_do_slot,
  b.horario       as rotulo_comprado,
  count(*)        as reservas,
  sum(b.quantidade) as pessoas
from public.experience_slots s
join public.bookings b on b.slot_id = s.id and b.status in ('pago','pending')
join public.experiences e on e.id = s.experience_id
where e.nome ilike '%incenso%'
  and s.data like '24/10%'
group by s.id, s.horario, b.horario
order by s.horario, b.horario;
