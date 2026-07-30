-- =========================================================
-- ELARAH — Colunas de controle das automações de WhatsApp
-- -----------------------------------------------------
-- Rode no SQL Editor do Supabase. Idempotente.
--
-- Marca "já enviei" de cada automação, POR RESERVA. Só é carimbado quando
-- o envio REAL acontece (em modo observação fica null — não consome).
-- Combinado com a whatsapp_send_log (UNIQUE), garante 1 envio por reserva.
--
-- No-backfill: as automações só pegam quem entra na JANELA de tempo daqui
-- pra frente (evento ~48h à frente, evento ~2 dias atrás, pendente 3-6h);
-- eventos/pendentes fora da janela nunca são disparados retroativamente.
-- =========================================================

alter table public.bookings
  add column if not exists reminder_48h_sent_at timestamptz;

alter table public.bookings
  add column if not exists feedback_whatsapp_sent_at timestamptz;

alter table public.bookings
  add column if not exists pending_recovery_sent_at timestamptz;

comment on column public.bookings.reminder_48h_sent_at is
  'Quando o lembrete de ~48h antes foi enviado (null = ainda não / observação).';
comment on column public.bookings.feedback_whatsapp_sent_at is
  'Quando o pedido de feedback por WhatsApp (~2 dias após o evento) foi enviado.';
comment on column public.bookings.pending_recovery_sent_at is
  'Quando a recuperação de reserva pendente (~3-6h) foi enviada.';

notify pgrst, 'reload schema';
