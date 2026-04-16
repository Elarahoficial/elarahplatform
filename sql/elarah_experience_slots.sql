-- =============================================================
-- ELARAH — experience_slots: vagas por horário
-- -------------------------------------------------------------
-- Cada linha representa um horário específico de uma experiência
-- com seu próprio controle de vagas (total / restantes).
--
-- Pré-requisitos:
--   1. elarah_supabase_setup.sql  (profiles, experiences, set_updated_at)
--   2. elarah_extensions.sql      (vagas_total/restantes na experiences,
--                                  decrement/increment_experience_vagas)
--   3. elarah_bookings.sql        (bookings)
--
-- Rode este arquivo UMA VEZ no SQL Editor do Supabase.
-- Ele é idempotente — pode rodar de novo sem quebrar.
-- =============================================================

-- ===== 1. Tabela experience_slots =====
create table if not exists public.experience_slots (
  id               uuid primary key default gen_random_uuid(),
  experience_id    uuid not null references public.experiences(id) on delete cascade,
  data             text,                           -- rótulo da data (ex: "15/04"), nullable
  horario          text not null,                  -- rótulo do horário (ex: "19h00 – 22h30")
  vagas_total      integer,                        -- null = ilimitado
  vagas_restantes  integer,                        -- calculado; null se vagas_total for null
  event_at         timestamptz,                    -- data/hora exata pro cálculo de cutoff
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Unique: não pode ter dois slots iguais pra mesma experiência+data+horário
-- coalesce(data,'') trata NULL como string vazia pra fins de unicidade
create unique index if not exists experience_slots_uq
  on public.experience_slots (experience_id, coalesce(data, ''), horario);

create index if not exists experience_slots_exp_idx
  on public.experience_slots (experience_id);

-- Trigger updated_at (reusa a função set_updated_at já existente)
drop trigger if exists set_experience_slots_updated_at on public.experience_slots;
create trigger set_experience_slots_updated_at
  before update on public.experience_slots
  for each row execute function set_updated_at();

-- ===== 2. Trigger: sync vagas_restantes quando vagas_total muda =====
create or replace function public.sync_slot_vagas_restantes()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.vagas_total is not null and NEW.vagas_restantes is null then
      NEW.vagas_restantes := NEW.vagas_total;
    end if;
  elsif TG_OP = 'UPDATE' then
    if NEW.vagas_total is distinct from OLD.vagas_total then
      if OLD.vagas_total is null and NEW.vagas_total is not null then
        NEW.vagas_restantes := NEW.vagas_total;
      elsif NEW.vagas_total is not null and OLD.vagas_total is not null then
        NEW.vagas_restantes := greatest(0,
          NEW.vagas_restantes + (NEW.vagas_total - OLD.vagas_total));
      elsif NEW.vagas_total is null then
        NEW.vagas_restantes := null;
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists sync_slot_vagas_restantes_trg on public.experience_slots;
create trigger sync_slot_vagas_restantes_trg
  before insert or update on public.experience_slots
  for each row execute function sync_slot_vagas_restantes();

-- ===== 3. RPC: decrement_slot_vagas (reservar vaga atômico) =====
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

  update public.experience_slots
     set vagas_restantes = vagas_restantes - v_qty
   where id = p_slot_id;

  return query select true, (v_rest - v_qty);
end;
$$;

-- ===== 4. RPC: increment_slot_vagas (devolver vaga — rollback) =====
create or replace function public.increment_slot_vagas(p_slot_id uuid, p_qty integer default 1)
returns void
language plpgsql security definer as $$
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

-- ===== 5. Coluna slot_id na bookings =====
alter table public.bookings
  add column if not exists slot_id uuid references public.experience_slots(id) on delete set null;

create index if not exists bookings_slot_idx
  on public.bookings (slot_id);

-- ===== 6. RLS =====
alter table public.experience_slots enable row level security;

-- Leitura pública (frontend precisa ver disponibilidade)
drop policy if exists "experience_slots_public_read" on public.experience_slots;
create policy "experience_slots_public_read" on public.experience_slots
  for select to anon, authenticated using (true);

-- Admin full access
drop policy if exists "experience_slots_admin_all" on public.experience_slots;
create policy "experience_slots_admin_all" on public.experience_slots
  for all to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ===== 7. Migração: semeia slots a partir das experiências existentes =====
-- Para cada experiência que tem horarios[], cria um slot por horário.
-- vagas_restantes é calculado descontando bookings ativos (pending/pago).
-- Se vagas_total era NULL (ilimitado), o slot também fica ilimitado.
insert into public.experience_slots (experience_id, data, horario, vagas_total, vagas_restantes, event_at)
select
  e.id,
  e.data,
  h.horario,
  e.vagas_total,
  case
    when e.vagas_total is null then null
    else greatest(0, e.vagas_total - coalesce(booked.cnt, 0))
  end,
  e.event_at
from public.experiences e
cross join lateral unnest(e.horarios) as h(horario)
left join (
  select experiencia_id, horario, count(*) as cnt
  from public.bookings
  where status in ('pending', 'pago')
  group by experiencia_id, horario
) booked on booked.experiencia_id = e.id and booked.horario = h.horario
where array_length(e.horarios, 1) > 0
on conflict do nothing;

-- ===== 8. Backfill slot_id em bookings existentes =====
-- Vincula bookings existentes ao slot correspondente.
update public.bookings b
   set slot_id = s.id
  from public.experience_slots s
 where b.slot_id is null
   and b.experiencia_id = s.experience_id
   and b.horario = s.horario
   and coalesce(b.data, '') = coalesce(s.data, '');
