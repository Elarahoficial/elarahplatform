-- =============================================================
-- ELARAH — Cupons promocionais (separado de gift cards)
-- -------------------------------------------------------------
-- Sistema profissional de cupons:
--   - Tipo: percentual (ex.: 10% OFF) OU valor fixo (R$ 50)
--   - Restrição opcional por experiência específica
--   - Validade temporal (valid_from + valid_until)
--   - Limite global de uso (max_uses) + contador (times_used)
--   - Rastreio individual de uso (tabela coupon_uses)
--
-- Por que tabela separada (e não estender gift_cards)?
--   gift_cards tem semântica de saldo (R$ que diminui), comprador,
--   destinatário, e-mail de presente. Cupom é instrumento de
--   marketing — código que gera desconto, sem saldo. Misturar os
--   dois polui as duas tabelas e complica o admin.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- =========================================================
-- 1. TABELA coupons
-- =========================================================
create table if not exists public.coupons (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  nome                text,                                     -- nome interno (campanha)
  descricao           text,                                     -- texto livre, exibido no admin

  -- Tipo de desconto
  discount_type       text not null check (discount_type in ('percent', 'value')),
  -- Pra discount_type='percent': 0 a 100 (10 = 10% OFF)
  -- Pra discount_type='value': centavos (5000 = R$ 50 OFF)
  discount_value      integer not null check (discount_value > 0),

  -- Restrição opcional por experiência
  experience_id       uuid references public.experiences(id) on delete cascade,

  -- Validade temporal
  valid_from          timestamptz not null default now(),
  valid_until         timestamptz not null,

  -- Limite de uso. NULL = ilimitado.
  max_uses            integer check (max_uses is null or max_uses > 0),
  times_used          integer not null default 0 check (times_used >= 0),

  -- Toggle manual do admin (kill switch sem precisar mudar valid_until)
  is_active           boolean not null default true,

  -- Auditoria
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Espaço pra metadados de campanha (UTM, lista de envio, etc.)
  metadata            jsonb not null default '{}'::jsonb
);

create index if not exists coupons_code_idx        on public.coupons (upper(code));
create index if not exists coupons_active_idx      on public.coupons (is_active, valid_until);
create index if not exists coupons_experience_idx  on public.coupons (experience_id);

-- Trigger updated_at — usa o helper já existente em elarah_extensions.sql
drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- =========================================================
-- 2. TABELA coupon_uses — rastreio individual
-- =========================================================
create table if not exists public.coupon_uses (
  id                          uuid primary key default gen_random_uuid(),
  coupon_id                   uuid not null references public.coupons(id) on delete cascade,
  booking_id                  uuid references public.bookings(id) on delete set null,
  user_id                     uuid references auth.users(id) on delete set null,
  email                       text,
  experience_id               uuid references public.experiences(id) on delete set null,
  amount_discount_centavos    integer not null check (amount_discount_centavos >= 0),
  used_at                     timestamptz not null default now()
);

create index if not exists coupon_uses_coupon_idx     on public.coupon_uses (coupon_id);
create index if not exists coupon_uses_booking_idx    on public.coupon_uses (booking_id);
create index if not exists coupon_uses_email_idx      on public.coupon_uses (lower(email));
create index if not exists coupon_uses_used_at_idx    on public.coupon_uses (used_at desc);

-- =========================================================
-- 3. COLUNAS em bookings — referência rápida ao cupom usado
-- =========================================================
alter table public.bookings
  add column if not exists coupon_id                  uuid references public.coupons(id) on delete set null,
  add column if not exists coupon_code                text,
  add column if not exists coupon_discount_centavos   integer;

create index if not exists bookings_coupon_idx on public.bookings (coupon_id);

-- =========================================================
-- 4. RLS
-- =========================================================
alter table public.coupons enable row level security;
alter table public.coupon_uses enable row level security;

-- Coupons: só admin gerencia. RPCs preview/hold/refund (security definer)
-- atendem o checkout sem precisar expor a tabela pra anon.
drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all"
  on public.coupons for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Coupon_uses: só admin lê. RPCs gravam via service_role.
drop policy if exists "coupon_uses_admin_all" on public.coupon_uses;
create policy "coupon_uses_admin_all"
  on public.coupon_uses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- 5. RPC: preview_coupon (não-destrutivo, frontend)
-- =========================================================
-- Frontend chama no campo de cupom enquanto o usuário digita pra
-- mostrar quanto vai abater. Não decrementa nada.
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
  v_c     public.coupons%rowtype;
  v_disc  integer;
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
-- 6. RPC: hold_coupon (atômico, incrementa times_used)
-- =========================================================
-- Chamado dentro do checkout. Bloqueia a linha do cupom (FOR UPDATE),
-- valida tudo de novo, e incrementa times_used. Caller deve guardar
-- coupon_id pra registrar o uso definitivo (register_coupon_use)
-- após confirmação do pagamento, ou refund_coupon em caso de falha.
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
-- 7. RPC: refund_coupon (best-effort rollback)
-- =========================================================
-- Chamado se a sessão de pagamento falhar/expirar antes da booking
-- ser confirmada. Decrementa times_used (com piso em 0) pra liberar
-- o slot pra outra pessoa.
create or replace function public.refund_coupon(p_coupon_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
     set times_used = greatest(0, times_used - 1),
         updated_at = now()
   where id = p_coupon_id;
end;
$$;

-- =========================================================
-- 8. RPC: register_coupon_use (chama no webhook após pagamento)
-- =========================================================
-- Grava na tabela de auditoria coupon_uses pra rastrear quem usou.
-- Chamado pelo stripe-webhook / mp-webhook após confirmação do
-- pagamento. Idempotente: usa booking_id como chave de dedup
-- (mesmo booking não vira 2 registros).
create or replace function public.register_coupon_use(
  p_coupon_id              uuid,
  p_booking_id             uuid,
  p_user_id                uuid,
  p_email                  text,
  p_experience_id          uuid,
  p_amount_discount_centavos integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_coupon_id is null then return; end if;

  -- Dedup: se já existe registro pra este booking_id, não duplica.
  if p_booking_id is not null
     and exists (select 1 from public.coupon_uses where booking_id = p_booking_id)
  then
    return;
  end if;

  insert into public.coupon_uses (
    coupon_id, booking_id, user_id, email, experience_id, amount_discount_centavos
  )
  values (
    p_coupon_id, p_booking_id, p_user_id, p_email, p_experience_id,
    coalesce(p_amount_discount_centavos, 0)
  );
end;
$$;

-- =========================================================
-- 9. GRANTs
-- =========================================================
grant execute on function public.preview_coupon(text, uuid, integer)        to anon, authenticated, service_role;
grant execute on function public.hold_coupon(text, uuid, integer)           to service_role;
grant execute on function public.refund_coupon(uuid)                        to service_role;
grant execute on function public.register_coupon_use(uuid, uuid, uuid, text, uuid, integer) to service_role;

-- =========================================================
-- 10. Refresh do cache do PostgREST
-- =========================================================
notify pgrst, 'reload schema';
