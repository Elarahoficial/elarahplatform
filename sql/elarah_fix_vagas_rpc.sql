-- =============================================================
-- ELARAH — Fix urgente: RPCs de vagas com p_qty
-- -------------------------------------------------------------
-- Resolve o erro `vagas_check_failed` que acontece quando o banco
-- ainda tem a versão antiga das funções de vagas (sem p_qty).
--
-- Causa raiz: `sql/elarah_extensions.sql` cria a versão `(uuid)` e
-- `sql/elarah_bookings_quantidade.sql` cria a versão `(uuid, integer)`.
-- Se só a antiga existe, a edge function (que sempre chama com p_qty)
-- bate em "function does not exist" e devolve `vagas_check_failed`.
--
-- Este script:
--   1. Faz DROP explícito das versões antigas (sem p_qty).
--   2. Recria as quatro funções com p_qty (assinatura nova).
--   3. Faz GRANT execute pra service_role e refresca o cache do
--      PostgREST via NOTIFY pgrst.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
--
-- A edge function `create-checkout-session` já tem fallback que
-- evita derrubar o pagamento se o RPC falhar; este script é a
-- correção raiz pra que o controle de estoque volte a funcionar.
-- =============================================================

-- ===== 1. DROP versões antigas (se existirem) =====
-- Sem `if exists` no parâmetro: PostgreSQL exige o tipo exato do
-- arg pra dropar a versão certa. As novas (com integer) ficam.
drop function if exists public.decrement_experience_vagas(uuid);
drop function if exists public.increment_experience_vagas(uuid);
drop function if exists public.decrement_slot_vagas(uuid);
drop function if exists public.increment_slot_vagas(uuid);

-- ===== 2. (Re)cria versões com p_qty =====

create or replace function public.decrement_slot_vagas(
  p_slot_id uuid,
  p_qty integer default 1
)
returns table(ok boolean, vagas_restantes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_rest  integer;
  v_qty   integer := greatest(1, coalesce(p_qty, 1));
begin
  select s.vagas_total, s.vagas_restantes
    into v_total, v_rest
    from public.experience_slots s
   where s.id = p_slot_id
     for update;

  if not found then
    return query select false, 0;
    return;
  end if;

  if v_total is null then
    return query select true, v_rest;
    return;
  end if;

  if v_rest is null or v_rest < v_qty then
    return query select false, coalesce(v_rest, 0);
    return;
  end if;

  update public.experience_slots
     set vagas_restantes = vagas_restantes - v_qty
   where id = p_slot_id;

  return query select true, (v_rest - v_qty);
end;
$$;

create or replace function public.increment_slot_vagas(
  p_slot_id uuid,
  p_qty integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qty integer := greatest(1, coalesce(p_qty, 1));
begin
  update public.experience_slots
     set vagas_restantes = least(
           coalesce(vagas_restantes, 0) + v_qty,
           coalesce(vagas_total, vagas_restantes + v_qty)
         )
   where id = p_slot_id
     and vagas_total is not null;
end;
$$;

create or replace function public.decrement_experience_vagas(
  p_experience_id uuid,
  p_qty integer default 1
)
returns table(ok boolean, vagas_restantes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_rest  integer;
  v_qty   integer := greatest(1, coalesce(p_qty, 1));
begin
  select e.vagas_total, e.vagas_restantes
    into v_total, v_rest
    from public.experiences e
   where e.id = p_experience_id
     for update;

  if not found then
    return query select false, 0;
    return;
  end if;

  if v_total is null then
    return query select true, v_rest;
    return;
  end if;

  if v_rest is null or v_rest < v_qty then
    return query select false, coalesce(v_rest, 0);
    return;
  end if;

  update public.experiences
     set vagas_restantes = vagas_restantes - v_qty
   where id = p_experience_id;

  return query select true, (v_rest - v_qty);
end;
$$;

create or replace function public.increment_experience_vagas(
  p_experience_id uuid,
  p_qty integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qty integer := greatest(1, coalesce(p_qty, 1));
begin
  update public.experiences
     set vagas_restantes = least(
           coalesce(vagas_restantes, 0) + v_qty,
           coalesce(vagas_total, vagas_restantes + v_qty)
         )
   where id = p_experience_id
     and vagas_total is not null;
end;
$$;

-- ===== 3. GRANTS =====
grant execute on function public.decrement_slot_vagas(uuid, integer) to service_role;
grant execute on function public.increment_slot_vagas(uuid, integer) to service_role;
grant execute on function public.decrement_experience_vagas(uuid, integer) to service_role;
grant execute on function public.increment_experience_vagas(uuid, integer) to service_role;

-- ===== 4. Refresh do cache do PostgREST =====
-- Sem isso, mesmo depois de criar a função, o PostgREST pode demorar
-- pra "ver" a nova assinatura. NOTIFY força o reload do schema.
notify pgrst, 'reload schema';
