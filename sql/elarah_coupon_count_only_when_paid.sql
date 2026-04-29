-- =============================================================
-- ELARAH — Cupom: incrementa SÓ quando o pagamento confirma
-- -------------------------------------------------------------
-- AJUSTE DE LÓGICA DE USO
--
-- ANTES: times_used incrementava no hold (criação da sessão Stripe).
-- Quem clicava em "Confirmar e pagar" mas não finalizava o pagamento
-- já consumia 1 uso → distorcia métricas e podia esgotar o cupom
-- sem venda real.
--
-- DEPOIS:
--   1. preview_coupon (aplicar)         → SÓ VALIDA. (já era assim)
--   2. hold_coupon (criar checkout)     → SÓ VALIDA. NÃO incrementa.
--   3. trigger booking.status='pago'    → INCREMENTA + grava em
--                                          coupon_uses (idempotente).
--   4. refund_gift_card de ghost        → só apaga o ghost, sem
--                                          decrementar nada (não foi
--                                          incrementado no hold).
--
-- O que isso preserva: cálculo, desconto, fluxo Stripe, restrição
-- por experiência, validade. Tudo igual. Só muda QUANDO o contador
-- sobe.
--
-- Trade-off ciente: como hold não decrementa max_uses, várias
-- pessoas podem iniciar checkout simultaneamente — todas validam
-- OK — e se TODAS pagarem, o times_used pode passar de max_uses
-- (overshoot). Risco baixo na prática (campanha de 50 usos com
-- janela de 48h e lista pequena). Se quiser blindagem, dá pra
-- rejeitar cupom no trigger se times_used >= max_uses, mas aí
-- alguém pode pagar e ficar sem cupom registrado. Não fazemos isso.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- ===== 1. hold_coupon: SÓ VALIDA, não incrementa =====
create or replace function public.hold_coupon(
  p_code text,
  p_experience_id uuid,
  p_amount_centavos integer
)
returns table(
  ok                boolean,
  coupon_id         uuid,
  discount_centavos integer,
  message           text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c     public.coupons%rowtype;
  v_disc  integer;
begin
  select * into v_c from public.coupons
   where upper(code) = upper(trim(p_code))
   limit 1;
  -- IMPORTANTE: removido FOR UPDATE — sem incremento, não precisamos
  -- bloquear a linha. Reduz contenção em cliques simultâneos.

  if not found then
    return query select false, null::uuid, 0, 'Cupom não encontrado.';
    return;
  end if;

  if v_c.is_active is false then
    return query select false, v_c.id, 0, 'Cupom desativado.';
    return;
  end if;

  if now() < v_c.valid_from then
    return query select false, v_c.id, 0, 'Cupom ainda não está ativo.';
    return;
  end if;

  if now() > v_c.valid_until then
    return query select false, v_c.id, 0, 'Cupom expirado.';
    return;
  end if;

  -- Checagem de max_uses ainda existe — barra cliques quando o
  -- contador real (incrementado no pagamento confirmado) bate o
  -- limite. NÃO incrementamos aqui.
  if v_c.max_uses is not null and v_c.times_used >= v_c.max_uses then
    return query select false, v_c.id, 0, 'Cupom esgotado.';
    return;
  end if;

  if v_c.experience_id is not null
     and p_experience_id is not null
     and v_c.experience_id <> p_experience_id then
    return query select false, v_c.id, 0, 'Cupom não é válido para esta experiência.';
    return;
  end if;

  if v_c.discount_type = 'percent' then
    v_disc := floor(p_amount_centavos::numeric * v_c.discount_value::numeric / 100);
  else
    v_disc := v_c.discount_value;
  end if;
  if v_disc > p_amount_centavos then v_disc := p_amount_centavos; end if;
  if v_disc < 0 then v_disc := 0; end if;

  -- ATENÇÃO: removida a linha
  --   update public.coupons set times_used = times_used + 1 ...
  -- O incremento agora vive no trigger trg_register_coupon_use_paid.

  return query select true, v_c.id, v_disc, 'OK';
end;
$$;

-- ===== 2. Idempotência do registro de uso =====
-- Cada booking só pode gerar UM registro de uso de cupom. Se o
-- webhook do Stripe rodar 2x (acontece — Stripe re-envia se não
-- recebe 200), o ON CONFLICT do trigger ignora a 2ª inserção e o
-- contador não dobra.
--
-- IMPORTANTE: índice SEM `where` clause. Partial indexes não
-- são reconhecidos por `ON CONFLICT (booking_id)` simples — daria
-- erro 42P10. PostgreSQL trata NULLs como distintos por padrão em
-- unique indexes, então múltiplas linhas com booking_id=NULL são
-- aceitas naturalmente.
create unique index if not exists coupon_uses_booking_id_unique
  on public.coupon_uses(booking_id);

-- ===== 3. Função do trigger =====
-- Roda quando uma booking transita pra status='pago'. Detecta se
-- a booking usou cupom (via gift_card_id apontando pra ghost OU
-- via coupon_id direto da EF nova quando deployada) e:
--   1. Insere em coupon_uses (dedup por booking_id)
--   2. Se a inserção foi nova, incrementa coupons.times_used
create or replace function public.register_coupon_use_on_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon_id   uuid;
  v_discount    integer;
  v_gc          public.gift_cards%rowtype;
  v_inserted_id uuid;
begin
  -- 1. EF nova: coupon_id direto na booking
  if NEW.coupon_id is not null then
    v_coupon_id := NEW.coupon_id;
    v_discount  := coalesce(NEW.coupon_discount_centavos, 0);
  -- 2. EF antiga via wrapper: ghost gift_card com metadata.coupon_id
  elsif NEW.gift_card_id is not null then
    select * into v_gc from public.gift_cards where id = NEW.gift_card_id;
    if not found then return NEW; end if;
    if v_gc.metadata is null then return NEW; end if;
    if v_gc.metadata->>'tipo' <> 'coupon_ghost' then return NEW; end if;
    if not (v_gc.metadata ? 'coupon_id') then return NEW; end if;
    v_coupon_id := (v_gc.metadata->>'coupon_id')::uuid;
    v_discount  := coalesce(NEW.gift_card_centavos, 0);
  else
    -- Booking sem cupom — nada a fazer.
    return NEW;
  end if;

  -- Insere registro de uso. ON CONFLICT garante idempotência:
  -- se booking_id já tem registro, retorna NULL em RETURNING e
  -- pulamos o increment.
  insert into public.coupon_uses (
    coupon_id,
    booking_id,
    user_id,
    email,
    experience_id,
    amount_discount_centavos
  ) values (
    v_coupon_id,
    NEW.id,
    NEW.user_id,
    NEW.email,
    NEW.experiencia_id,
    v_discount
  )
  on conflict (booking_id) do nothing
  returning id into v_inserted_id;

  -- Só incrementa se foi inserção nova.
  if v_inserted_id is not null then
    update public.coupons
       set times_used = times_used + 1,
           updated_at = now()
     where id = v_coupon_id;
  end if;

  return NEW;
exception when others then
  -- Trigger NUNCA pode quebrar a transação que marca pagamento.
  -- Se algo der errado aqui, loga via raise warning e segue —
  -- pior caso, o admin reconcilia depois.
  raise warning '[register_coupon_use_on_paid] erro: % (booking=%)', sqlerrm, NEW.id;
  return NEW;
end;
$$;

-- ===== 4. Trigger AFTER UPDATE: dispara quando vira 'pago' =====
drop trigger if exists trg_register_coupon_use_paid on public.bookings;
create trigger trg_register_coupon_use_paid
  after update on public.bookings
  for each row
  when (
    OLD.status is distinct from 'pago'
    and NEW.status = 'pago'
  )
  execute function public.register_coupon_use_on_paid();

-- Cobre também o caso (raro) de booking nascer já com status='pago'
-- (cupom 100% que pula Stripe).
drop trigger if exists trg_register_coupon_use_paid_insert on public.bookings;
create trigger trg_register_coupon_use_paid_insert
  after insert on public.bookings
  for each row
  when (NEW.status = 'pago')
  execute function public.register_coupon_use_on_paid();

-- ===== 5. refund_gift_card: simplificado pra ghost =====
-- Como hold_coupon não incrementa mais, refund_gift_card de ghost
-- não precisa decrementar times_used. Só apaga o ghost (limpeza).
-- Gift cards reais: comportamento original (devolver saldo).
create or replace function public.refund_gift_card(
  p_gift_card_id uuid,
  p_amount_centavos integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gc  public.gift_cards%rowtype;
  v_new integer;
begin
  if p_gift_card_id is null then return; end if;

  select * into v_gc from public.gift_cards
   where id = p_gift_card_id
   for update;
  if not found then return; end if;

  -- Ghost de cupom: só apaga (cupom não foi incrementado, nada a refundar)
  if v_gc.metadata is not null
     and v_gc.metadata->>'tipo' = 'coupon_ghost'
  then
    delete from public.gift_cards where id = p_gift_card_id;
    return;
  end if;

  -- Gift card real: devolve saldo
  if p_amount_centavos is null or p_amount_centavos <= 0 then
    return;
  end if;

  v_new := least(v_gc.valor_inicial_centavos, v_gc.saldo_centavos + p_amount_centavos);

  update public.gift_cards
     set saldo_centavos = v_new,
         status         = case when v_new > 0 then 'active' else status end
   where id = p_gift_card_id;
end;
$$;

-- ===== 6. Reset do PINTURA10 — limpa contagem inflada =====
-- Hoje (no momento de rodar este SQL) o times_used da PINTURA10
-- está alto sem refletir vendas reais. Reseta pra 0 e recomputa
-- baseado APENAS em bookings pagas que usaram o cupom.
--
-- NÃO MEXEMOS em bookings — só na contagem do cupom.
update public.coupons c
   set times_used = (
     select count(*)
       from public.bookings b
      where b.status = 'pago'
        and (
          b.coupon_id = c.id
          or b.gift_card_id in (
            select gc.id from public.gift_cards gc
             where gc.metadata->>'tipo' = 'coupon_ghost'
               and (gc.metadata->>'coupon_id')::uuid = c.id
          )
        )
   ),
       updated_at = now()
 where c.code = 'PINTURA10';

-- ===== 7. Backfill de coupon_uses pra bookings já pagas com cupom =====
-- Se já houve venda real com PINTURA10 ANTES deste fix (com o
-- contador inflado), garante que coupon_uses tenha o registro
-- correto. ON CONFLICT impede duplicatas.
insert into public.coupon_uses (
  coupon_id,
  booking_id,
  user_id,
  email,
  experience_id,
  amount_discount_centavos,
  used_at
)
select
  c.id as coupon_id,
  b.id as booking_id,
  b.user_id,
  b.email,
  b.experiencia_id,
  coalesce(b.coupon_discount_centavos, b.gift_card_centavos, 0),
  coalesce(b.created_at, now())
from public.bookings b
join public.coupons c on (
       c.id = b.coupon_id
    or c.id::text = (
         select gc.metadata->>'coupon_id'
           from public.gift_cards gc
          where gc.id = b.gift_card_id
       )
   )
where b.status = 'pago'
on conflict (booking_id) do nothing;

-- ===== 8. GRANTs =====
grant execute on function public.hold_coupon(text, uuid, integer)             to service_role;
grant execute on function public.refund_gift_card(uuid, integer)              to service_role;
grant execute on function public.register_coupon_use_on_paid()                to service_role;

-- ===== 9. Refresh PostgREST =====
notify pgrst, 'reload schema';

-- ===== 10. Verificação =====
select
  c.code,
  c.times_used,
  c.max_uses,
  (select count(*) from public.coupon_uses where coupon_id = c.id) as uses_registrados
from public.coupons c
where c.code = 'PINTURA10';
