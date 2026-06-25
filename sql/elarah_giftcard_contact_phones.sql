-- =============================================================
-- ELARAH — Telefone/WhatsApp do comprador e do destinatário em gift_cards
-- -------------------------------------------------------------
-- Pra permitir follow-up por WhatsApp (além do e-mail) dos gift cards
-- pendentes, guardamos o telefone das duas pontas:
--
--   comprador_telefone     → quem comprou (e precisa concluir o pagto)
--   destinatario_telefone  → quem vai receber o presente
--
-- Capturado no formulário de compra (presentear.js) e gravado pelas
-- Edge Functions create-checkout-session / create-mp-pix-payment já no
-- registro 'pending'. Mostrado no admin (aba Gift Cards) com link wa.me.
--
-- IDEMPOTENTE — pode rodar quantas vezes quiser.
-- =============================================================

alter table public.gift_cards
  add column if not exists comprador_telefone     text,
  add column if not exists destinatario_telefone  text;

notify pgrst, 'reload schema';
