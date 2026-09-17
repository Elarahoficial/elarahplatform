-- =========================================================
-- ELARAH — Avaliação de EVENTOS fechados
-- =========================================================
-- Até aqui só quem comprava pelo site (bookings) recebia o link do
-- avaliar.html. Evento fechado (aniversário, despedida, corporativo)
-- entra pelo financeiro como venda manual (public.manual_sales com
-- is_event), então a avaliação dele não tinha onde encaixar.
--
-- Esta migração dá pro evento o MESMO caminho da experiência normal:
--   • reviews.manual_sale_id  → de qual evento fechado veio a nota
--   • reviews.tipo            → 'experiencia' (site) ou 'evento'
--   • reviews.evento_tipo     → aniversário, corporativo… (snapshot)
--   • manual_sales.feedback_solicitado_at / _by  → pedido manual (aba
--       Feedbacks → Eventos, botão do WhatsApp)
--   • manual_sales.review_request_sent_at        → pedido por e-mail
--       (mesma Edge Function reviews, mode "request")
--
-- Uma avaliação por evento (índice único), igual à regra de 1 por
-- reserva. As avaliações antigas viram tipo = 'experiencia'.
--
-- Rode UMA vez no SQL Editor. Idempotente.
-- Pré-requisitos: sql/elarah_reviews.sql, sql/elarah_manual_sales.sql,
--                 sql/elarah_manual_sales_eventos.sql.
-- =========================================================

-- ---------- reviews: de onde veio a nota ----------
alter table public.reviews
  add column if not exists manual_sale_id uuid
    references public.manual_sales(id) on delete set null,
  add column if not exists tipo text not null default 'experiencia',
  add column if not exists evento_tipo text;

-- Registro antigo não tem manual_sale_id: é tudo experiência do site.
update public.reviews set tipo = 'experiencia'
  where tipo is null or tipo not in ('experiencia', 'evento');

alter table public.reviews drop constraint if exists reviews_tipo_check;
alter table public.reviews
  add constraint reviews_tipo_check check (tipo in ('experiencia', 'evento'));

-- 1 avaliação por evento fechado (não deixa avaliar 2x pelo mesmo link).
create unique index if not exists reviews_manual_sale_uidx
  on public.reviews (manual_sale_id) where manual_sale_id is not null;
create index if not exists reviews_tipo_idx on public.reviews (tipo);

-- ---------- manual_sales: quem já recebeu o pedido ----------
-- Mesma semântica das colunas de bookings:
--   feedback_solicitado_at → a admin clicou "Pedir avaliação" (WhatsApp)
--   review_request_sent_at → o e-mail automático saiu (cron)
alter table public.manual_sales
  add column if not exists feedback_solicitado_at timestamptz,
  add column if not exists feedback_solicitado_by uuid
    references auth.users(id) on delete set null,
  add column if not exists review_request_sent_at timestamptz;

create index if not exists manual_sales_feedback_idx
  on public.manual_sales (feedback_solicitado_at);

-- RLS: nada a mudar. reviews continua com leitura pública só das
-- aprovadas (a nota do evento é prova social igual à da experiência) e
-- o INSERT segue exclusivo da Edge Function (service role, valida o
-- token do link). manual_sales já tem a policy manual_sales_admin_all,
-- que cobre a gravação do "pedido enviado" pelo painel.

notify pgrst, 'reload schema';

-- =========================================================
-- VERIFICAÇÃO
--   select tipo, count(*) from public.reviews group by tipo;
--   select r.nota, r.comentario, m.customer_name, m.experience_name
--     from public.reviews r
--     join public.manual_sales m on m.id = r.manual_sale_id
--    order by r.created_at desc limit 20;
-- =========================================================
