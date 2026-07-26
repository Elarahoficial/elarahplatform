-- =========================================================
-- ELARAH — Bookings / Pagar.me columns — idempotent
-- =========================================================
-- Adiciona suporte a pagamentos via Pagar.me (PIX + cartão à vista +
-- cartão parcelado), o gateway definitivo do checkout da Elarah.
--
-- Depende de:
--   * sql/elarah_bookings.sql já executado (cria public.bookings)
--   * sql/elarah_bookings_mp.sql já executado (cria payment_provider)
--
-- Colunas adicionadas (nullable, default null):
--   * pagarme_order_id   — ID da order retornada pela API Pagar.me (or_...)
--   * pagarme_charge_id  — ID da charge (ch_...) pra estorno/conciliação
--
-- A coluna payment_provider (criada em elarah_bookings_mp.sql) passa a
-- aceitar também o valor 'pagarme'. Não há CHECK constraint — o campo
-- fica aberto pra múltiplos providers sem nova migration.
--
-- Estratégia de reconciliação (espelha o Mercado Pago):
--   1. pagarme_order_id / pagarme_charge_id (caminho ideal)
--   2. order.code == bookings.id (external reference que nós geramos)
--   3. stripe_session_id == 'PME-<order_id>' (placeholder no UNIQUE)
--
-- Compatibilidade:
--   Bookings antigas ficam com pagarme_order_id = null. O webhook do
--   Pagar.me só reconcilia bookings com payment_provider='pagarme' ou
--   com o placeholder 'PME-' — nunca toca em bookings do MP/Stripe.
-- =========================================================

alter table public.bookings
  add column if not exists pagarme_order_id text,
  add column if not exists pagarme_charge_id text;

-- Índice pra lookup rápido no webhook do Pagar.me (busca por order id).
create index if not exists bookings_pagarme_order_idx
  on public.bookings (pagarme_order_id)
  where pagarme_order_id is not null;

-- Índice auxiliar pra estorno/conciliação por charge id.
create index if not exists bookings_pagarme_charge_idx
  on public.bookings (pagarme_charge_id)
  where pagarme_charge_id is not null;

-- Mesma coluna também nos gift_cards, pro fluxo de gift card via Pagar.me
-- (espelha o que o MP faz gravando mp_payment_id no metadata do gift_card).
alter table public.gift_cards
  add column if not exists pagarme_order_id text;

create index if not exists gift_cards_pagarme_order_idx
  on public.gift_cards (pagarme_order_id)
  where pagarme_order_id is not null;

-- Nota: não adicionamos constraint CHECK no payment_provider
-- propositalmente — deixa aberto pra 'pagarme' e futuros providers sem
-- precisar de nova migration.
