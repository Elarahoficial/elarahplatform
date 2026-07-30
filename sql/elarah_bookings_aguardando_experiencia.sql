-- =========================================================
-- ELARAH — Bookings: coluna aguardando_experiencia
-- -----------------------------------------------------
-- Rode este arquivo no SQL Editor do Supabase.
-- É idempotente: pode rodar várias vezes sem efeito colateral.
--
-- Depende de:
--   * public.bookings (criada em elarah_bookings.sql)
--
-- CONTEXTO
-- Quando um cliente pede (normalmente pelo WhatsApp) pra desmarcar a
-- experiência SEM reembolso — porque vai remarcar / usar o valor em
-- outra experiência mais pra frente — a admin marca a reserva como
-- "Aguardando experiência" no painel (lápis / editar).
--
-- Enquanto a reserva estiver com aguardando_experiencia = true:
--   1. NENHUMA mensagem automática vai pro cliente (nem confirmação,
--      nem lembrete, nem o "como foi sua experiência?"). Toda função
--      que envia mensagem PRO CLIENTE checa isCustomerMessagingSuppressed
--      (supabase/functions/_shared/email.ts) antes de disparar.
--   2. A vaga da data original é DEVOLVIDA ao estoque (a pessoa não vai
--      naquela data) — feito pela edge function admin-set-aguardando-
--      experiencia, que roda com service_role.
--
-- A reserva continua com status = 'pago' (não há reembolso, o valor fica
-- com a Elarah e segue na contabilidade) e continua editável no painel,
-- pra a admin remarcar pra nova experiência quando o cliente escolher.
--
-- NOTA: cada comando abaixo fica em UMA linha só de propósito — alguns
-- executores de SQL quebram comandos multi-linha no ponto errado.
-- =========================================================

alter table public.bookings add column if not exists aguardando_experiencia boolean not null default false;

alter table public.bookings add column if not exists aguardando_experiencia_at timestamptz;

create index if not exists bookings_aguardando_experiencia_idx on public.bookings (aguardando_experiencia) where aguardando_experiencia = true;

comment on column public.bookings.aguardando_experiencia is 'true = cliente desmarcou a experiencia SEM reembolso e esta aguardando escolher uma nova. Nesse estado a reserva NAO recebe nenhuma mensagem automatica e a vaga original volta pro estoque. status continua pago (valor mantido).';

comment on column public.bookings.aguardando_experiencia_at is 'Momento em que a reserva foi marcada como aguardando_experiencia (null quando nao esta).';

notify pgrst, 'reload schema';

-- =========================================================
-- Registros antigos ficam com aguardando_experiencia = false (default).
--
-- Se o SEU executor ainda reclamar do "where" no create index (índice
-- parcial), rode a versão sem WHERE no lugar dele — funciona igual:
--   create index if not exists bookings_aguardando_experiencia_idx on public.bookings (aguardando_experiencia);
-- =========================================================
