-- =============================================================
-- ELARAH — Backfill: marca bookings pagos antigos como já avisados
-- -------------------------------------------------------------
-- Setup: rode DEPOIS da migration sql/elarah_bookings_fornecedor_avisado.sql
-- (que cria a coluna fornecedor_avisado_at).
--
-- Marca como avisados todos os bookings com status='pago' que ainda
-- não tem timestamp. Usa now() — assume que admin já avisou todos
-- antes desta feature existir.
--
-- IDEMPOTENTE — só toca em rows com fornecedor_avisado_at IS NULL.
-- Bookings novos (não pagos ainda, ou criados após esse backfill)
-- continuam aparecendo como vermelho até o admin clicar "Avisar".
-- =============================================================

update public.bookings
   set fornecedor_avisado_at = now()
 where status = 'pago'
   and fornecedor_avisado_at is null;

-- Quantos foram marcados (verifique no painel de output do SQL Editor):
-- "UPDATE N" onde N = total de bookings retroativamente marcados.
