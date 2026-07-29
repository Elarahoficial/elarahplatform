-- =========================================================
-- ELARAH — Bookings: coluna acompanhantes (grupos > 1 pessoa)
-- -----------------------------------------------------
-- Rode este arquivo no SQL Editor do Supabase.
-- É idempotente: pode rodar várias vezes sem efeito colateral.
--
-- Depende de:
--   * public.bookings (criada em elarah_bookings.sql)
--
-- CONTEXTO
-- No checkout, quando a quantidade é maior que 1, o formulário coleta
-- nome + WhatsApp de cada acompanhante (quantidade - 1 pessoas, já que
-- a Pessoa 1 é o próprio comprador). Esses dados são gravados aqui, na
-- coluna dedicada `acompanhantes`, no formato:
--
--   [{"nome":"Maria","telefone":"11999999999"}]
--
-- telefone = só dígitos, sempre com DDD + número (>= 10 dígitos).
-- =========================================================

alter table public.bookings
  add column if not exists acompanhantes jsonb not null default '[]'::jsonb;

comment on column public.bookings.acompanhantes is
  'Acompanhantes do grupo (Pessoas 2..N; o comprador é a Pessoa 1 e NÃO entra aqui). Formato jsonb: [{"nome": text, "telefone": text-só-dígitos-com-DDD}]. Preenchido pelas edge functions de pagamento na criação da booking. Bookings de 1 pessoa ficam com [].';

-- =========================================================
-- Registros antigos ficam com [] (default). O front e o e-mail de
-- confirmação já toleram lista vazia, mantendo compatibilidade total.
-- =========================================================
