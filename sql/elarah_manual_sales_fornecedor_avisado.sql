-- =============================================================
-- ELARAH — Venda manual: "avisar fornecedor" (recado da compra)
-- -------------------------------------------------------------
-- Espelha bookings.fornecedor_avisado_at/_by nas vendas manuais.
-- Permite marcar, na aba Compras, que a fornecedora já recebeu o
-- recado da compra (mensagem de WhatsApp pronta), com estado verde
-- "✓ Avisado" igual às vendas do site.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: public.manual_sales, auth.users.
-- =============================================================

alter table public.manual_sales
  add column if not exists fornecedor_avisado_at timestamptz,
  add column if not exists fornecedor_avisado_by uuid references auth.users(id) on delete set null;

notify pgrst, 'reload schema';
