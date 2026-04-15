-- =========================================================
-- ELARAH — Bookings / Mercado Pago columns — idempotent
-- =========================================================
-- Adiciona suporte a pagamentos via Mercado Pago PIX.
--
-- Depende de:
--   * sql/elarah_bookings.sql já executado (cria public.bookings)
--
-- Colunas adicionadas (nullable, default null):
--   * mp_payment_id       — ID do pagamento retornado pela API MP
--   * payment_provider    — 'stripe' | 'mercado_pago' | null (legado)
--
-- Compatibilidade:
--   Bookings antigas ficam com payment_provider = null, que é tratado
--   como stripe no código (default). Admin continua lendo b.status e
--   b.nome normalmente — não precisa atualizar a UI.
-- =========================================================

alter table public.bookings
  add column if not exists mp_payment_id text,
  add column if not exists payment_provider text;

-- Índice pra lookup rápido no webhook do MP (busca por mp_payment_id).
create index if not exists bookings_mp_payment_idx
  on public.bookings (mp_payment_id)
  where mp_payment_id is not null;

-- Índice auxiliar pra filtros por provider no admin (stats futuras).
create index if not exists bookings_provider_idx
  on public.bookings (payment_provider)
  where payment_provider is not null;

-- Nota: não adicionamos constraint CHECK no payment_provider
-- propositalmente — deixa aberto pra futuros providers sem
-- precisar de nova migration.
