-- =============================================================
-- ELARAH — Fix urgente: RPCs de vagas (com p_qty + sem ambiguidade)
-- -------------------------------------------------------------
-- Resolve dois problemas em sequência que estavam quebrando o
-- checkout em produção:
--
-- (A) Versão antiga das funções `decrement_*_vagas` no banco não
--     aceitava o parâmetro p_qty. Edge functions chamavam com p_qty
--     e batiam em "function does not exist" → vagas_check_failed.
--
-- (B) Após criar as versões novas com p_qty, surgiu erro PostgreSQL
--     42702 — "column reference vagas_restantes is ambiguous". Causa:
--     `RETURNS TABLE(ok boolean, vagas_restantes integer)` declara
--     `vagas_restantes` como variável OUTPUT da função; dentro do
--     UPDATE, o lado direito da expressão `set vagas_restantes =
--     vagas_restantes - v_qty` ficava ambíguo entre coluna da tabela
--     e variável OUTPUT.
--
-- Esta versão corrigida:
--   1. DROP explícito das versões antigas (sem p_qty).
--   2. Recria as quatro funções com p_qty.
--   3. UPDATE usa ALIAS da tabela e qualifica TODAS as referências
--      (`set vagas_restantes = e.vagas_restantes - v_qty`), eliminando
--      o erro 42702.
--   4. GRANTs e NOTIFY pgrst pra refresh.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
-- =============================================================

-- ===== 1. DROP versões antigas (se existirem) =====
drop function if exists public.decrement_experience_vagas(uuid);
drop function if exists public.increment_experience_vagas(uuid);
drop function if exists public.decrement_slot_vagas(uuid);
drop function if exists public.increment_slot_vagas(uuid);

-- ===== 2. (Re)cria versões com p_qty + alias qualificado =====

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

  -- Sem teto (ilimitado) → sempre OK, devolve restante atual.
  if v_total is null then
    return query select true, v_rest;
    return;
  end if;

  if v_rest is null or v_rest < v_qty then
    return query select false, coalesce(v_rest, 0);
    return;
  end if;

  -- IMPORTANTE: alias `s` + qualificação `s.vagas_restantes` no lado
  -- direito da expressão. Sem isso, PostgreSQL lança erro 42702 —
  -- vagas_restantes é tanto coluna da tabela quanto variável OUTPUT
  -- da função (declarada em RETURNS TABLE acima).
  update public.experience_slots s
     set vagas_restantes = s.vagas_restantes - v_qty
   where s.id = p_slot_id;

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
  -- Embora esta função retorne void (sem variável OUTPUT colidindo),
  -- mantemos o alias `s` por consistência com decrement_* e como
  -- defesa contra futuras mudanças de assinatura.
  update public.experience_slots s
     set vagas_restantes = least(
           coalesce(s.vagas_restantes, 0) + v_qty,
           coalesce(s.vagas_total, s.vagas_restantes + v_qty)
         )
   where s.id = p_slot_id
     and s.vagas_total is not null;
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

  -- Mesma defesa contra ambiguidade que em decrement_slot_vagas.
  update public.experiences e
     set vagas_restantes = e.vagas_restantes - v_qty
   where e.id = p_experience_id;

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
  update public.experiences e
     set vagas_restantes = least(
           coalesce(e.vagas_restantes, 0) + v_qty,
           coalesce(e.vagas_total, e.vagas_restantes + v_qty)
         )
   where e.id = p_experience_id
     and e.vagas_total is not null;
end;
$$;

-- ===== 3. GRANTS =====
grant execute on function public.decrement_slot_vagas(uuid, integer) to service_role;
grant execute on function public.increment_slot_vagas(uuid, integer) to service_role;
grant execute on function public.decrement_experience_vagas(uuid, integer) to service_role;
grant execute on function public.increment_experience_vagas(uuid, integer) to service_role;

-- ===== 4. Refresh do cache do PostgREST =====
notify pgrst, 'reload schema';
