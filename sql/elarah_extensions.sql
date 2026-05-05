-- =========================================================
-- ELARAH PLATFORM — extensions
-- -----------------------------------------------------
-- Adiciona:
--   1) Controle de vagas por experiência (vagas_total / vagas_restantes)
--   2) Data/hora absoluta da experiência (event_at) + cutoff (cutoff_hours)
--   3) Tabela gift_cards e funções atômicas pra resgate
--   4) Colunas em bookings pra rastrear uso de gift card
--
-- Idempotente: pode rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase DEPOIS de elarah_supabase_setup.sql
-- e elarah_bookings.sql.
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- 1) EXPERIENCES — vagas e cutoff
-- =========================================================
alter table public.experiences
  add column if not exists vagas_total      integer,
  add column if not exists vagas_restantes  integer,
  add column if not exists event_at         timestamptz,
  add column if not exists cutoff_hours     integer not null default 24;

-- Quando o admin altera vagas_total, mantém vagas_restantes coerente
-- (sem nunca permitir que restantes ultrapasse o novo total).
create or replace function public.sync_vagas_restantes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.vagas_total is not null and new.vagas_restantes is null then
      new.vagas_restantes := new.vagas_total;
    end if;
    return new;
  end if;

  -- UPDATE
  if new.vagas_total is distinct from old.vagas_total then
    if new.vagas_total is null then
      -- Vagas ilimitadas: zera o controle.
      new.vagas_restantes := null;
    elsif old.vagas_total is null then
      -- Antes era ilimitado, agora tem teto: começa cheio.
      new.vagas_restantes := new.vagas_total;
    else
      -- Ajusta delta: soma a diferença pra não invalidar reservas
      -- já feitas.
      new.vagas_restantes := greatest(
        0,
        coalesce(new.vagas_restantes, old.vagas_restantes, 0) + (new.vagas_total - old.vagas_total)
      );
      if new.vagas_restantes > new.vagas_total then
        new.vagas_restantes := new.vagas_total;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_experiences_sync_vagas on public.experiences;
create trigger trg_experiences_sync_vagas
  before insert or update on public.experiences
  for each row execute function public.sync_vagas_restantes();

-- Decremento atômico de vaga. Retorna false se esgotou.
-- vagas_total NULL = ilimitado (sempre ok).
create or replace function public.decrement_experience_vagas(p_experience_id uuid)
returns table(ok boolean, vagas_restantes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_rest  integer;
begin
  select e.vagas_total, e.vagas_restantes
    into v_total, v_rest
    from public.experiences e
   where e.id = p_experience_id
   for update;

  if not found then
    return query select false, null::integer;
    return;
  end if;

  -- Sem teto definido = ilimitado
  if v_total is null then
    return query select true, null::integer;
    return;
  end if;

  if v_rest is null or v_rest <= 0 then
    return query select false, coalesce(v_rest, 0);
    return;
  end if;

  update public.experiences
     set vagas_restantes = vagas_restantes - 1
   where id = p_experience_id
   returning vagas_restantes into v_rest;

  return query select true, v_rest;
end;
$$;

-- Devolve uma vaga (cancelamento / reembolso / expiração).
create or replace function public.increment_experience_vagas(p_experience_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_rest  integer;
begin
  select vagas_total, vagas_restantes
    into v_total, v_rest
    from public.experiences
   where id = p_experience_id
   for update;

  if not found or v_total is null then
    return;
  end if;

  update public.experiences
     set vagas_restantes = least(v_total, coalesce(v_rest, 0) + 1)
   where id = p_experience_id;
end;
$$;

grant execute on function public.decrement_experience_vagas(uuid) to service_role;
grant execute on function public.increment_experience_vagas(uuid) to service_role;

-- =========================================================
-- 2) GIFT CARDS
-- =========================================================
create table if not exists public.gift_cards (
  id                    uuid primary key default gen_random_uuid(),
  code                  text unique not null,
  valor_inicial_centavos integer not null check (valor_inicial_centavos > 0),
  saldo_centavos        integer not null check (saldo_centavos >= 0),
  status                text not null default 'active'
                          check (status in ('pending','active','used','expired','cancelled')),
  comprador_user_id     uuid references auth.users(id) on delete set null,
  comprador_email       text,
  comprador_nome        text,
  destinatario_email    text,
  destinatario_nome     text,
  mensagem              text,
  stripe_session_id     text unique,
  email_sent_at         timestamptz,
  expires_at            timestamptz,
  created_at            timestamptz not null default now(),
  redeemed_first_at     timestamptz,
  redeemed_last_at      timestamptz,
  metadata              jsonb not null default '{}'::jsonb
);

create index if not exists gift_cards_code_idx        on public.gift_cards (upper(code));
create index if not exists gift_cards_status_idx      on public.gift_cards (status);
create index if not exists gift_cards_destinatario_idx on public.gift_cards (destinatario_email);
create index if not exists gift_cards_comprador_idx   on public.gift_cards (comprador_email);

drop trigger if exists trg_gift_cards_updated_at on public.gift_cards;
-- (gift_cards usa só created_at; não precisa de updated_at)

alter table public.gift_cards enable row level security;

drop policy if exists "gift_cards_owner_read" on public.gift_cards;
drop policy if exists "gift_cards_admin_all"  on public.gift_cards;

-- Comprador e destinatário enxergam o próprio gift card.
create policy "gift_cards_owner_read"
  on public.gift_cards for select
  to authenticated
  using (
    auth.uid() = comprador_user_id
    or lower(coalesce(auth.email(), '')) = lower(coalesce(comprador_email, ''))
    or lower(coalesce(auth.email(), '')) = lower(coalesce(destinatario_email, ''))
  );

-- Admin enxerga e gerencia tudo.
create policy "gift_cards_admin_all"
  on public.gift_cards for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- 3) BOOKINGS — referência ao gift card usado
-- =========================================================
alter table public.bookings
  add column if not exists gift_card_id        uuid references public.gift_cards(id) on delete set null,
  add column if not exists gift_card_centavos  integer,
  add column if not exists gift_card_code      text;

create index if not exists bookings_gift_card_idx on public.bookings (gift_card_id);

-- =========================================================
-- 4) Funções atômicas de resgate de gift card
-- =========================================================

-- Validação não-destrutiva (frontend usa pra mostrar quanto vai abater).
create or replace function public.preview_gift_card(p_code text)
returns table(
  found boolean,
  valid boolean,
  status text,
  saldo_centavos integer,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gc public.gift_cards%rowtype;
begin
  select * into v_gc from public.gift_cards
   where upper(code) = upper(trim(p_code))
   limit 1;

  if not found then
    return query select false, false, null::text, 0, 'Código não encontrado';
    return;
  end if;

  if v_gc.status <> 'active' then
    return query select true, false, v_gc.status, v_gc.saldo_centavos,
                  case v_gc.status
                    when 'used'      then 'Gift card já utilizado'
                    when 'expired'   then 'Gift card expirado'
                    when 'pending'   then 'Gift card pendente de pagamento'
                    when 'cancelled' then 'Gift card cancelado'
                    else 'Gift card indisponível'
                  end;
    return;
  end if;

  if v_gc.expires_at is not null and v_gc.expires_at < now() then
    return query select true, false, 'expired', v_gc.saldo_centavos, 'Gift card expirado';
    return;
  end if;

  if v_gc.saldo_centavos <= 0 then
    return query select true, false, 'used', 0, 'Gift card sem saldo';
    return;
  end if;

  return query select true, true, 'active', v_gc.saldo_centavos, 'OK';
end;
$$;

-- Hold/consumo: trava o saldo agora. Usado em create-checkout-session.
-- Se a reserva for cancelada/expirar, refund_gift_card devolve.
create or replace function public.hold_gift_card(p_code text, p_amount_centavos integer)
returns table(
  ok boolean,
  gift_card_id uuid,
  used_centavos integer,
  novo_saldo integer,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gc public.gift_cards%rowtype;
  v_use integer;
  v_new integer;
begin
  if p_amount_centavos is null or p_amount_centavos <= 0 then
    return query select false, null::uuid, 0, 0, 'Valor inválido';
    return;
  end if;

  select * into v_gc from public.gift_cards
   where upper(code) = upper(trim(p_code))
   for update;

  if not found then
    return query select false, null::uuid, 0, 0, 'Código não encontrado';
    return;
  end if;

  if v_gc.status <> 'active' then
    return query select false, v_gc.id, 0, v_gc.saldo_centavos, 'Gift card ' || v_gc.status;
    return;
  end if;

  if v_gc.expires_at is not null and v_gc.expires_at < now() then
    update public.gift_cards set status = 'expired' where id = v_gc.id;
    return query select false, v_gc.id, 0, v_gc.saldo_centavos, 'Gift card expirado';
    return;
  end if;

  if v_gc.saldo_centavos <= 0 then
    update public.gift_cards set status = 'used' where id = v_gc.id;
    return query select false, v_gc.id, 0, 0, 'Gift card sem saldo';
    return;
  end if;

  v_use := least(v_gc.saldo_centavos, p_amount_centavos);
  v_new := v_gc.saldo_centavos - v_use;

  update public.gift_cards
     set saldo_centavos = v_new,
         status         = case when v_new <= 0 then 'used' else 'active' end,
         redeemed_first_at = coalesce(redeemed_first_at, now()),
         redeemed_last_at  = now()
   where id = v_gc.id;

  return query select true, v_gc.id, v_use, v_new, 'OK';
end;
$$;

-- Refund: devolve saldo a um gift card, usado quando uma reserva
-- com cupom expira/é cancelada.
create or replace function public.refund_gift_card(p_gift_card_id uuid, p_amount_centavos integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gc public.gift_cards%rowtype;
  v_new integer;
begin
  if p_gift_card_id is null or p_amount_centavos is null or p_amount_centavos <= 0 then
    return;
  end if;

  select * into v_gc from public.gift_cards where id = p_gift_card_id for update;
  if not found then
    return;
  end if;

  v_new := least(v_gc.valor_inicial_centavos, v_gc.saldo_centavos + p_amount_centavos);

  update public.gift_cards
     set saldo_centavos = v_new,
         status = case
                    when v_gc.status = 'used' and v_new > 0 then 'active'
                    else v_gc.status
                  end
   where id = v_gc.id;
end;
$$;

grant execute on function public.preview_gift_card(text)              to anon, authenticated, service_role;
grant execute on function public.hold_gift_card(text, integer)        to service_role;
grant execute on function public.refund_gift_card(uuid, integer)      to service_role;

-- =========================================================
-- FIM
-- =========================================================
