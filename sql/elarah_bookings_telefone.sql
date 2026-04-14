-- =========================================================
-- ELARAH — Bookings: adiciona coluna telefone (WhatsApp)
-- -----------------------------------------------------
-- Rode este arquivo no SQL Editor do Supabase.
-- É idempotente: pode rodar várias vezes sem efeito colateral.
--
-- Depende de:
--   * public.bookings (criada em elarah_bookings.sql)
-- =========================================================

alter table public.bookings
  add column if not exists telefone text;

-- Índice opcional pra buscar reservas por telefone no painel admin
-- (útil pra contatar um cliente específico por WhatsApp).
create index if not exists bookings_telefone_idx
  on public.bookings (telefone);

-- Comentário explícito pra quem olhar o schema no Supabase
comment on column public.bookings.telefone is
  'Telefone/WhatsApp do cliente (pode ser null em bookings antigas). Salvo tanto na criação da sessão Stripe (status=pending) quanto no webhook (status=pago).';

-- =========================================================
-- Registros antigos ficam com telefone NULL.
-- O admin renderiza "—" quando o campo é null, mantendo
-- compatibilidade total.
-- =========================================================
