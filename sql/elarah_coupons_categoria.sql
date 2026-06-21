-- =============================================================
-- ELARAH — Cupom restrito por CATEGORIA
-- -------------------------------------------------------------
-- Adiciona a possibilidade de um cupom valer só para uma
-- categoria (ex.: "Kit em casa" / Elarah em Casa), além da
-- restrição já existente por experiência específica.
--
-- O que muda:
--   1. Nova coluna coupons.categoria (text, nullable).
--      NULL/'' = vale pra qualquer categoria.
--   2. preview_coupon() e hold_coupon() passam a validar a
--      categoria da experiência do checkout contra a do cupom
--      (case-insensitive). Como o checkout já manda
--      p_experience_id, derivamos a categoria a partir dela.
--
-- Assinaturas das funções NÃO mudam — nenhum grant novo é
-- necessário. Roda depois de sql/elarah_coupons.sql.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- =========================================================
-- 1. COLUNA categoria
-- =========================================================
alter table public.coupons
  add column if not exists categoria text;

-- Index pra filtros/relatórios por categoria (case-insensitive)
create index if not exists coupons_categoria_idx
  on public.coupons (lower(categoria));

-- =========================================================
-- 2. RPC: preview_coupon (agora valida categoria)
-- =========================================================
create or replace function public.preview_coupon(
  p_code text,
  p_experience_id uuid,
  p_amount_centavos integer
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
  v_c        public.coupons%rowtype;
  v_disc     integer;
  v_exp_cat  text;
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

  -- Restrição por categoria: deriva a categoria da experiência do
  -- checkout e compara (case-insensitive) com a do cupom.
  if v_c.categoria is not null and length(trim(v_c.categoria)) > 0 then
    select categoria into v_exp_cat
      from public.experiences where id = p_experience_id;
    if v_exp_cat is null
       or lower(trim(v_exp_cat)) <> lower(trim(v_c.categoria)) then
      return query select true, false, v_c.id, v_c.discount_type, v_c.discount_value, 0,
        'Cupom válido só para a categoria ' || v_c.categoria || '.';
      return;
    end if;
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
-- 3. RPC: hold_coupon (agora valida categoria)
-- =========================================================
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
  v_c        public.coupons%rowtype;
  v_disc     integer;
  v_exp_cat  text;
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

  -- Restrição por categoria (mesma regra do preview_coupon)
  if v_c.categoria is not null and length(trim(v_c.categoria)) > 0 then
    select categoria into v_exp_cat
      from public.experiences where id = p_experience_id;
    if v_exp_cat is null
       or lower(trim(v_exp_cat)) <> lower(trim(v_c.categoria)) then
      return query select false, v_c.id, 0,
        'Cupom válido só para a categoria ' || v_c.categoria || '.';
      return;
    end if;
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
-- 4. Refresh do cache do PostgREST
-- =========================================================
notify pgrst, 'reload schema';
