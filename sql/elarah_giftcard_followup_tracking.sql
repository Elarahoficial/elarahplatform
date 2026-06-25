-- =============================================================
-- ELARAH — Tracking de follow-up por E-MAIL em gift_cards
-- -------------------------------------------------------------
-- Gift cards "pendentes" são compras que a pessoa COMEÇOU mas não
-- concluiu o pagamento. O follow-up por e-mail cutuca o comprador
-- pra finalizar. Estas colunas registram quem já recebeu follow-up,
-- pra não duplicar disparo e pra alimentar o modo automático (cron).
--
--   followup_sent_at    → timestamp do último follow-up enviado
--   followup_count      → quantos follow-ups já foram disparados
--   followup_last_to    → pra qual e-mail foi o último envio
--
-- Usado por:
--   - supabase/functions/giftcard-followup (envio manual e automático)
--   - Modal "Follow-up por e-mail" no admin (aba Gift Cards → Pendentes)
--
-- IDEMPOTENTE — pode rodar quantas vezes quiser.
-- =============================================================

alter table public.gift_cards
  add column if not exists followup_sent_at   timestamptz,
  add column if not exists followup_count     integer not null default 0,
  add column if not exists followup_last_to   text;

-- Índice parcial pro modo automático achar rápido quem está
-- pendente e ainda não recebeu (ou recebeu há tempo) follow-up.
create index if not exists gift_cards_followup_idx
  on public.gift_cards (status, followup_sent_at)
  where status = 'pending';

notify pgrst, 'reload schema';
