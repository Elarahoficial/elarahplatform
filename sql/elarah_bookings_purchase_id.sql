-- =============================================================
-- ELARAH — bookings.purchase_id (anti COBRANÇA DUPLA no cartão)
-- -------------------------------------------------------------
-- Adiciona uma chave ESTÁVEL por tentativa de compra, gerada uma
-- única vez pelo front e reenviada em toda retentativa. Serve pra:
--
--   1. Dedupe server-side em create-pagarme-card-payment: se a MESMA
--      compra chega de novo (retry do front, timeout de rede DEPOIS
--      da captura), a função devolve a booking que já existe em vez
--      de reservar vaga e COBRAR O CARTÃO OUTRA VEZ.
--   2. X-Idempotency-Key no Pagar.me (na própria create-*-card): a
--      mesma purchase_id colapsa na mesma captura no gateway.
--
-- O índice único PARCIAL (só quando purchase_id não é nulo) garante
-- que dois pedidos concorrentes da mesma compra não gerem duas
-- bookings — o segundo insert falha (23505) e a função trata como
-- dedupe. Fluxos que ainda não mandam purchase_id (PIX, Stripe, MP)
-- gravam NULL e continuam funcionando (vários NULLs são permitidos).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Como rodar: Supabase Dashboard → SQL Editor → cola → Run.
-- =============================================================

alter table public.bookings
  add column if not exists purchase_id text;

-- Um purchase_id → no máximo uma booking. NULL é ignorado pelo índice
-- parcial (fluxos legados sem purchase_id não são afetados).
create unique index if not exists bookings_purchase_id_uq
  on public.bookings (purchase_id)
  where purchase_id is not null;

-- Busca rápida do dedupe.
create index if not exists bookings_purchase_id_idx
  on public.bookings (purchase_id);

notify pgrst, 'reload schema';
