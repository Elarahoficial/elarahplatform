-- =============================================================
-- ELARAH — Tracking de follow-up por WhatsApp em byelarah_submissions
-- -------------------------------------------------------------
-- Adiciona 2 colunas pra que o admin saiba quem já recebeu
-- follow-up de cada campanha:
--
--   whatsapp_followup_sent_at  → timestamp do último envio
--   whatsapp_followup_count    → contador (caso queira reenviar)
--
-- Uso:
--   - Modal de follow-up no admin (By Elarah → botão WhatsApp)
--     marca essas colunas ao clicar em "Abrir conversa".
--   - Lista mostra status: cinza (não contatado) / verde (contatado).
--   - Operador pode filtrar "só não contatados" pra evitar duplicar.
--
-- IDEMPOTENTE.
-- =============================================================

alter table public.byelarah_submissions
  add column if not exists whatsapp_followup_sent_at  timestamptz,
  add column if not exists whatsapp_followup_count    integer not null default 0;

create index if not exists byelarah_submissions_followup_idx
  on public.byelarah_submissions (whatsapp_followup_sent_at)
  where whatsapp_followup_sent_at is not null;

notify pgrst, 'reload schema';
