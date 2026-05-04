-- =============================================================
-- ELARAH — bookings: rastreia se admin avisou o fornecedor
-- -------------------------------------------------------------
-- Adiciona timestamp do aviso ao fornecedor. Botão "Avisar" na aba
-- Compras passa a alternar entre 2 estados visuais:
--   - vermelho "Avisar"  (fornecedor_avisado_at IS NULL)
--   - verde "✓ Avisado"  (fornecedor_avisado_at IS NOT NULL)
--
-- Não é estado de pagamento — é só pra admin saber em quem ja
-- mandou o WhatsApp (antes não tinha rastreio nenhum, dava pra
-- avisar 2x ou esquecer).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

alter table public.bookings
  add column if not exists fornecedor_avisado_at timestamptz,
  add column if not exists fornecedor_avisado_by uuid
    references auth.users(id) on delete set null;

create index if not exists bookings_fornecedor_avisado_idx
  on public.bookings (fornecedor_avisado_at);

notify pgrst, 'reload schema';
