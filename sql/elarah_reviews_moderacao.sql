-- =========================================================
-- ELARAH — Moderação de avaliações (ocultar do site)
-- =========================================================
-- A coluna `aprovado` já existia em elarah_reviews.sql prevendo
-- moderação, e as duas telas públicas (experiencia.html e o detalhe
-- do script.js) já filtram `aprovado = true`. Faltavam duas coisas
-- pra o botão "Ocultar" da aba Feedbacks funcionar:
--
--   1) permissão de UPDATE pro admin — só havia policy de SELECT,
--      então o painel não conseguia virar a chave;
--   2) rastro de quem ocultou e quando.
--
-- IMPORTANTE: ocultar mexe SÓ no que o site mostra. A aba Feedbacks
-- continua contando a avaliação oculta na média, na distribuição e
-- no ranking por parceiro — senão o painel passaria a mentir pra
-- quem precisa decidir o que melhorar. A aba mostra lado a lado a
-- média real e a média que o site exibe.
--
-- Rode UMA vez no SQL Editor do Supabase. Idempotente.
-- Pré-requisito: sql/elarah_reviews.sql.
-- =========================================================

alter table public.reviews
  add column if not exists oculto_at timestamptz,
  add column if not exists oculto_by uuid
    references auth.users(id) on delete set null;

comment on column public.reviews.oculto_at is
  'Quando um admin ocultou a avaliação do site (aprovado -> false). null = nunca foi ocultada.';
comment on column public.reviews.oculto_by is
  'Admin que ocultou. Auditoria — fica gravado mesmo depois de voltar a mostrar.';

-- Índice pra listar rápido só as ocultas no filtro da aba.
create index if not exists reviews_aprovado_idx
  on public.reviews (aprovado) where aprovado = false;

-- ---------- RLS: UPDATE só pro admin ----------
-- Cliente nunca edita avaliação (nem a própria): o insert já é feito
-- pela Edge Function com service role, e não existe tela de edição.
-- Sem `with check` o admin poderia gravar linha que ele mesmo não
-- enxergaria depois — os dois lados usam is_admin().
drop policy if exists "reviews_admin_update" on public.reviews;
create policy "reviews_admin_update" on public.reviews
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- VERIFICAÇÃO
--   -- o que o site está escondendo hoje:
--   select experiencia_nome, nota, comentario, oculto_at
--     from public.reviews where aprovado = false
--     order by oculto_at desc;
--
--   -- média real x média que o site mostra:
--   select round(avg(nota), 2) as media_real,
--          round(avg(nota) filter (where aprovado), 2) as media_no_site,
--          count(*) filter (where not aprovado) as ocultas
--     from public.reviews;
-- =========================================================
