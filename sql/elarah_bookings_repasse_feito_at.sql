-- =====================================================================
-- bookings.repasse_feito_at — data em que o repasse foi marcado como feito
-- =====================================================================
-- Guarda QUANDO o admin marcou o repasse ao fornecedor como feito (o
-- "check" na aba Compras). Usado no extrato/comprovante de repasses por
-- fornecedor: mostra a data em que cada repasse foi efetuado e filtra o
-- extrato por mês.
--
-- Backfill: bookings já marcadas como 'repasse_feito' antes desta coluna
-- ficam com a data aproximada = created_at (melhor estimativa disponível).
--
-- Aditivo e idempotente — seguro rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table public.bookings
  add column if not exists repasse_feito_at timestamptz;

update public.bookings
   set repasse_feito_at = created_at
 where status_fornecedor = 'repasse_feito'
   and repasse_feito_at is null;

notify pgrst, 'reload schema';
