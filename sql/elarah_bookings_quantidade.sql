-- =============================================================
-- ELARAH — Suporte a quantidade (multi-participante)
-- -------------------------------------------------------------
-- Permite reservar mais de 1 vaga por booking. Cada participante
-- adicional é registrado no metadata.participantes[].
--
-- Rode este arquivo UMA VEZ no SQL Editor do Supabase.
-- Idempotente — pode rodar de novo sem quebrar.
-- =============================================================

-- ===== 1. Coluna quantidade na bookings =====
alter table public.bookings
  add column if not exists quantidade integer not null default 1;

-- ===== 2. Atualiza decrement_slot_vagas pra aceitar quantidade =====
create or replace function public.decrement_slot_vagas(p_slot_id uuid, p_qty integer default 1)
returns table(ok boolean, vagas_restantes integer)
language plpgsql security definer as $$
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

  -- Alias `s` + qualificação evita erro 42702 (vagas_restantes
  -- ambíguo entre coluna e variável OUTPUT da função).
  update public.experience_slots s
     set vagas_restantes = s.vagas_restantes - v_qty
   where s.id = p_slot_id;

  return query select true, (v_rest - v_qty);
end;
$$;

-- ===== 3. Atualiza increment_slot_vagas pra aceitar quantidade =====
create or replace function public.increment_slot_vagas(p_slot_id uuid, p_qty integer default 1)
returns void
language plpgsql security definer as $$
declare
  v_qty integer := greatest(1, coalesce(p_qty, 1));
begin
  update public.experience_slots s
     set vagas_restantes = least(
           coalesce(s.vagas_restantes, 0) + v_qty,
           coalesce(s.vagas_total, s.vagas_restantes + v_qty)
         )
   where s.id = p_slot_id
     and s.vagas_total is not null;
end;
$$;

-- ===== 4. Atualiza decrement_experience_vagas pra aceitar quantidade =====
create or replace function public.decrement_experience_vagas(p_experience_id uuid, p_qty integer default 1)
returns table(ok boolean, vagas_restantes integer)
language plpgsql security definer as $$
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

  -- Alias `e` + qualificação evita erro 42702.
  update public.experiences e
     set vagas_restantes = e.vagas_restantes - v_qty
   where e.id = p_experience_id;

  return query select true, (v_rest - v_qty);
end;
$$;

-- ===== 5. Atualiza increment_experience_vagas pra aceitar quantidade =====
create or replace function public.increment_experience_vagas(p_experience_id uuid, p_qty integer default 1)
returns void
language plpgsql security definer as $$
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
