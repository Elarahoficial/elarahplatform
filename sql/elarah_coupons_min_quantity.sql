-- =============================================================
-- ELARAH — Cupons: trava por QUANTIDADE mínima (ex.: PAI15 = 2+ lugares)
-- -------------------------------------------------------------
-- Adiciona a regra "o cupom só vale se a compra tiver N ou mais
-- lugares (quantidade)". Usado no Dia dos Pais: PAI15 = 15% OFF
-- SÓ quando a pessoa compra 2 lugares ou mais ("um pra você, outro
-- pro seu pai").
--
-- O que muda:
--   1. Nova coluna coupons.min_quantity (NULL / 1 = sem restrição).
--   2. preview_coupon e hold_coupon ganham o parâmetro p_quantidade
--      (default 1) e recusam o cupom quando quantidade < min_quantity.
--   3. PAI15 recebe min_quantity = 2.
--
-- Por que é à prova de esperteza: o hold_coupon (que trava o cupom no
-- momento do pagamento) roda no backend, que recalcula a quantidade
-- real da reserva a partir do servidor — o cliente não consegue forjar.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
--
-- DEPENDÊNCIA: rodar antes sql/elarah_coupons.sql (cria a tabela + RPCs).
-- =============================================================

-- =========================================================
-- 1. COLUNA min_quantity
-- =========================================================
alter table public.coupons
  add column if not exists min_quantity integer
    check (min_quantity is null or min_quantity >= 1);

comment on column public.coupons.min_quantity is
  'Quantidade mínima de lugares na compra pra o cupom valer. NULL/1 = sem restrição.';

-- =========================================================
-- 2. preview_coupon — agora com p_quantidade
-- -------------------------------------------------------------
-- Precisamos DROPAR a versão antiga de 3 args, senão o Postgres fica
-- com duas funções sobrecarregadas e o PostgREST reclama de ambiguidade
-- quando o front chama sem p_quantidade.
-- =========================================================
drop function if exists public.preview_coupon(text, uuid, integer);

create or replace function public.preview_coupon(
  p_code text,
  p_experience_id uuid,
  p_amount_centavos integer,
  p_quantidade integer default 1
)
returns table(
  found             boolean,
  valid             boolean,
  coupon_id         uuid,
  discount_type     text,
  discount_value    integer,
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
  v_qty   integer := greatest(1, coalesce(p_quantidade, 1));
begin
  select * into v_c from public.coupons
   where upper(code) = upper(trim(p_code))
   limit 1;

  if not found then
    return query select false, false, null::uuid, null::text, null::integer, 0, 'Cupom não encontrado.';
    return;
  end if;

  if v_c.is_active is false then
    return query select true, false, v_c.id, v_c.discount_type, v_c.discount_value, 0, 'Cupom desativado.';
    return;
  end if;

  if now() < v_c.valid_from then
    return query select true, false, v_c.id, v_c.discount_type, v_c.discount_value, 0, 'Cupom ainda não está ativo.';
    return;
  end if;

  if now() > v_c.valid_until then
    return query select true, false, v_c.id, v_c.discount_type, v_c.discount_value, 0, 'Cupom expirado.';
    return;
  end if;

  if v_c.max_uses is not null and v_c.times_used >= v_c.max_uses then
    return query select true, false, v_c.id, v_c.discount_type, v_c.discount_value, 0, 'Cupom esgotado.';
    return;
  end if;

  if v_c.experience_id is not null
     and (p_experience_id is null or v_c.experience_id <> p_experience_id) then
    return query select true, false, v_c.id, v_c.discount_type, v_c.discount_value, 0, 'Cupom não é válido para esta experiência.';
    return;
  end if;

  -- NOVA REGRA: quantidade mínima
  if v_c.min_quantity is not null and v_c.min_quantity > 1 and v_qty < v_c.min_quantity then
    return query select true, false, v_c.id, v_c.discount_type, v_c.discount_value, 0,
      'Cupom válido só na compra de ' || v_c.min_quantity || ' lugares ou mais.';
    return;
  end if;

  -- Calcula desconto sobre p_amount_centavos
  if v_c.discount_type = 'percent' then
    v_disc := floor(p_amount_centavos::numeric * v_c.discount_value::numeric / 100);
  else
    v_disc := v_c.discount_value;
  end if;

  -- Cap no valor da compra — desconto nunca > total
  if v_disc > p_amount_centavos then
    v_disc := p_amount_centavos;
  end if;
  if v_disc < 0 then v_disc := 0; end if;

  return query select true, true, v_c.id, v_c.discount_type, v_c.discount_value, v_disc, 'OK';
end;
$$;

-- =========================================================
-- 3. hold_coupon — agora com p_quantidade
-- =========================================================
drop function if exists public.hold_coupon(text, uuid, integer);

create or replace function public.hold_coupon(
  p_code text,
  p_experience_id uuid,
  p_amount_centavos integer,
  p_quantidade integer default 1
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
  v_qty   integer := greatest(1, coalesce(p_quantidade, 1));
begin
  select * into v_c from public.coupons
   where upper(code) = upper(trim(p_code))
   for update
   limit 1;

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

  if v_c.max_uses is not null and v_c.times_used >= v_c.max_uses then
    return query select false, v_c.id, 0, 'Cupom esgotado.';
    return;
  end if;

  if v_c.experience_id is not null
     and (p_experience_id is null or v_c.experience_id <> p_experience_id) then
    return query select false, v_c.id, 0, 'Cupom não é válido para esta experiência.';
    return;
  end if;

  -- NOVA REGRA: quantidade mínima
  if v_c.min_quantity is not null and v_c.min_quantity > 1 and v_qty < v_c.min_quantity then
    return query select false, v_c.id, 0,
      'Cupom válido só na compra de ' || v_c.min_quantity || ' lugares ou mais.';
    return;
  end if;

  if v_c.discount_type = 'percent' then
    v_disc := floor(p_amount_centavos::numeric * v_c.discount_value::numeric / 100);
  else
    v_disc := v_c.discount_value;
  end if;
  if v_disc > p_amount_centavos then v_disc := p_amount_centavos; end if;
  if v_disc < 0 then v_disc := 0; end if;

  -- Incrementa atomicamente
  update public.coupons
     set times_used = times_used + 1,
         updated_at = now()
   where id = v_c.id;

  return query select true, v_c.id, v_disc, 'OK';
end;
$$;

-- =========================================================
-- 4. PAI15 = 2 lugares ou mais
-- =========================================================
update public.coupons
   set min_quantity = 2,
       updated_at = now()
 where upper(code) = 'PAI15';

-- =========================================================
-- 5. GRANTs (novas assinaturas de 4 args)
-- =========================================================
grant execute on function public.preview_coupon(text, uuid, integer, integer) to anon, authenticated, service_role;
grant execute on function public.hold_coupon(text, uuid, integer, integer)     to service_role;

-- =========================================================
-- 6. Refresh do cache do PostgREST
-- =========================================================
notify pgrst, 'reload schema';

-- Confere
select code, nome, discount_value, min_quantity, valid_until, max_uses, times_used, is_active
from public.coupons
where upper(code) = 'PAI15';
