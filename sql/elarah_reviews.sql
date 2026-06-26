-- =========================================================
-- ELARAH — Avaliações reais dos clientes (prova social)
-- =========================================================
-- Guarda a nota (1-5) + comentário de quem JÁ VIVEU a experiência.
-- Só quem comprou consegue avaliar (link com token no e-mail pós-
-- experiência), então pode auto-aprovar — é tudo real.
-- Mostra na página da experiência (prova social) e alimenta os
-- agentes CEO e Eventos.
--
-- Rode UMA vez no SQL Editor. Idempotente.
-- Pré-requisito: tabelas bookings e experiences.
-- =========================================================

create table if not exists public.reviews (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid references public.bookings(id) on delete set null,
  experiencia_id    uuid references public.experiences(id) on delete set null,
  experiencia_nome  text,
  nome              text,                       -- primeiro nome do cliente (exibição)
  nota              integer not null check (nota between 1 and 5),
  comentario        text,
  aprovado          boolean not null default true,
  created_at        timestamptz not null default now()
);

-- 1 avaliação por reserva (não deixa avaliar 2x pelo mesmo link).
create unique index if not exists reviews_booking_uidx
  on public.reviews (booking_id) where booking_id is not null;
create index if not exists reviews_exp_idx on public.reviews (experiencia_id);
create index if not exists reviews_created_idx on public.reviews (created_at desc);

-- Marca quando o pedido de avaliação por E-MAIL foi enviado (≠ do
-- feedback manual por WhatsApp que já existia).
alter table public.bookings
  add column if not exists review_request_sent_at timestamptz;

-- ---------- RLS ----------
alter table public.reviews enable row level security;

-- Público (site) lê só as APROVADAS — pra mostrar na página. Sem expor
-- e-mail/booking: a página seleciona apenas colunas públicas.
drop policy if exists "reviews_public_read_approved" on public.reviews;
create policy "reviews_public_read_approved" on public.reviews
  for select to anon, authenticated using (aprovado = true);

-- Admin lê tudo (inclusive não aprovadas, se um dia houver moderação).
drop policy if exists "reviews_admin_read" on public.reviews;
create policy "reviews_admin_read" on public.reviews
  for select to authenticated using (public.is_admin());

-- INSERT: ninguém via cliente. Quem grava é a Edge Function (service
-- role, ignora RLS) depois de validar o token do link. Sem policy de
-- insert pra anon/authenticated = bloqueado por padrão.

-- =========================================================
-- VERIFICAÇÃO
--   select experiencia_nome, nota, comentario, created_at
--     from public.reviews order by created_at desc limit 20;
--   select experiencia_id, round(avg(nota),2) media, count(*) total
--     from public.reviews where aprovado group by experiencia_id;
-- =========================================================
