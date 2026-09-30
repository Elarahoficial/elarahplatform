-- =============================================================
-- ELARAH — Trocas: trava contra cobrança dupla + titular do Pix
-- -------------------------------------------------------------
-- Complementa os SQLs anteriores de trocas_reserva (rode aqueles antes).
--
-- 1. Uma reserva só pode ter UMA tentativa de pagamento de diferença em
--    aberto por vez. Dois cliques (ou duas abas) ao mesmo tempo não criam
--    duas cobranças: o segundo insert bate neste índice e a função devolve
--    a tentativa que já existe.
-- 2. Nome do titular da chave Pix (reembolso da sobra), pra Elarah conferir
--    no app do banco antes de enviar.
--
-- Idempotente. Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

-- Se por acaso já houver duas tentativas em aberto da mesma reserva,
-- mantém a mais nova e marca as outras como canceladas (senão o índice
-- abaixo não pode ser criado).
update public.trocas_reserva t
   set status = 'cancelada'
 where t.tipo = 'troca'
   and t.status = 'aguardando_pagamento'
   and exists (
     select 1 from public.trocas_reserva o
      where o.booking_id = t.booking_id
        and o.tipo = 'troca'
        and o.status in ('aguardando_pagamento', 'processando')
        and o.created_at > t.created_at
   );

create unique index if not exists trocas_reserva_uma_pendente
  on public.trocas_reserva (booking_id)
  where tipo = 'troca' and status in ('aguardando_pagamento', 'processando');

alter table public.trocas_reserva
  add column if not exists reembolso_pix_titular text;
