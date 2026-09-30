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
        and o.id <> t.id
        and (o.status = 'processando'
             or (o.status = 'aguardando_pagamento' and o.created_at > t.created_at))
   );

create unique index if not exists trocas_reserva_uma_pendente
  on public.trocas_reserva (booking_id)
  where tipo = 'troca' and status in ('aguardando_pagamento', 'processando');

alter table public.trocas_reserva
  add column if not exists reembolso_pix_titular text;

-- Como a Elarah resolveu um caso de dinheiro (pagou e não entrou, estorno):
-- preenchido pelo botão "Resolver" da aba. Sem isso a linha fica pendente.
alter table public.trocas_reserva
  add column if not exists resolucao text;

-- =============================================================
-- Crédito de troca (cupom CREDITO-…): UMA compra por vez
-- -------------------------------------------------------------
-- O cupom de crédito tem max_uses = 1, mas o contador de uso pode subir só
-- quando a compra é paga (depende da versão de hold_coupon no banco). Sem
-- esta trava, a cliente poderia abrir 2 checkouts com o mesmo crédito e
-- pagar os dois. Aqui: se o crédito já está numa compra pendente ou paga,
-- uma segunda compra com ele é recusada na hora de ser criada.
-- Só vale pros cupons de crédito de troca (metadata.origem =
-- 'troca_cliente'); os cupons de campanha continuam como sempre.
-- =============================================================
create or replace function public.trava_credito_troca_uso_unico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.coupon_id is null or coalesce(new.status, 'pending') not in ('pending', 'pago') then
    return new;
  end if;
  if not exists (
    select 1 from public.coupons c
     where c.id = new.coupon_id and c.metadata->>'origem' = 'troca_cliente'
  ) then
    return new;
  end if;
  -- Serializa compras simultâneas com o mesmo crédito.
  perform pg_advisory_xact_lock(hashtext('credito_troca:' || new.coupon_id::text));
  if exists (
    select 1 from public.bookings b
     where b.coupon_id = new.coupon_id
       and b.id <> new.id
       and b.status in ('pending', 'pago')
  ) then
    raise exception 'Este crédito já está sendo usado em outra compra.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_trava_credito_troca on public.bookings;
create trigger trg_trava_credito_troca
  before insert on public.bookings
  for each row execute function public.trava_credito_troca_uso_unico();
