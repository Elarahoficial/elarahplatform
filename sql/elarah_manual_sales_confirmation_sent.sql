-- =============================================================
-- ELARAH — Venda manual: carimbo de "confirmação enviada" pro cliente
-- -------------------------------------------------------------
-- Guarda quando o e-mail de confirmação da compra (o mesmo "Sua reserva
-- na Elarah está confirmada ✨" das vendas do site) foi enviado pra
-- cliente de uma venda manual. Serve pra mostrar o estado "✓ enviado"
-- no painel e evitar reenvio acidental.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: public.manual_sales.
-- =============================================================

alter table public.manual_sales
  add column if not exists confirmation_email_sent_at timestamptz;

notify pgrst, 'reload schema';
