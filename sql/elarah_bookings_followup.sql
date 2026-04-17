-- =============================================================
-- ELARAH — Follow-up de compras pendentes
-- -------------------------------------------------------------
-- Controle de follow-up por WhatsApp para recuperacao de vendas.
--
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente.
-- =============================================================

alter table public.bookings
  add column if not exists followup_status text not null default 'nenhum'
    check (followup_status in ('nenhum', 'primeiro_enviado', 'segundo_enviado', 'recuperado', 'expirado')),
  add column if not exists followup_1_at timestamptz,
  add column if not exists followup_2_at timestamptz;

create index if not exists bookings_followup_idx
  on public.bookings (followup_status) where status = 'pending';
