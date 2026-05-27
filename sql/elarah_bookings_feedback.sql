-- =============================================================
-- ELARAH — Follow-up pós-evento (pedido de feedback)
-- -------------------------------------------------------------
-- Marca quando o admin solicitou avaliação da experiência ao
-- cliente (via WhatsApp, 24h+ após o evento). Sem isso, o admin
-- não tem como saber pra quem já mandou o pedido de feedback e
-- pra quem ainda falta.
--
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente.
-- =============================================================

alter table public.bookings
  add column if not exists feedback_solicitado_at timestamptz,
  add column if not exists feedback_solicitado_by uuid
    references auth.users(id) on delete set null;

comment on column public.bookings.feedback_solicitado_at is
  'Timestamp do clique do admin no botão "Pedir feedback" (aba Pós-compra).';
comment on column public.bookings.feedback_solicitado_by is
  'Admin que disparou o pedido de feedback. Auditoria.';
