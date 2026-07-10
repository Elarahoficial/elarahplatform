-- =============================================================
-- ELARAH — Venda manual desconta vaga (fecha overbooking)
-- -------------------------------------------------------------
-- Problema que motivou este script (caso real "Bordado em Caderno"):
--   A experiência tinha 2 vagas. A admin registrou 1 venda manual e o
--   site vendeu mais 2 — total de 3 pessoas em 2 lugares — porque a
--   venda manual vivia numa tabela separada e NÃO mexia no contador de
--   vagas (`experience_slots.vagas_restantes`). O site continuava
--   achando que tinha 2 vagas livres.
--
-- Correção: a venda manual passa a OCUPAR vaga igual à venda do site.
--   * INSERT de venda manual (pago/pendente) → decrementa a vaga.
--   * Cancelar/reembolsar/excluir → devolve a vaga.
--   * Editar (mudar status/quantidade/data) → ajusta o delta.
-- Como o contador exibido no admin já soma `vagas_restantes` dos slots,
-- o "X / Y" passa a refletir a lotação REAL sem mudar nada na UI.
--
-- A vaga é resolvida pro SLOT específico (experience + data + horário)
-- quando dá pra casar; senão cai no contador da experiência. Isso é
-- persistido em `manual_sales.slot_id` na hora do salvamento.
--
-- Overbooking fica VISÍVEL: um decremento forçado pode deixar
-- `vagas_restantes` negativo (ex.: "-1 / 2" em vermelho). É proposital —
-- comunica que passou da lotação e mantém o site travado (a trava de
-- checkout bloqueia quando restante < quantidade).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar. No fim há a
-- reconciliação única que RECALCULA todos os contadores a partir da
-- verdade (bookings + vendas manuais), corrigindo qualquer drift atual.
--
-- Depende de: experience_slots, experiences, bookings, manual_sales.
-- Rode no SQL Editor do Supabase.
-- =============================================================

-- ===== 1. Coluna slot_id em manual_sales =====
alter table public.manual_sales
  add column if not exists slot_id uuid references public.experience_slots(id) on delete set null;

create index if not exists manual_sales_slot_idx
  on public.manual_sales (slot_id);


-- ===== 2. Resolver: casa (experiência, data, horário) → slot =====
-- Estratégia, do mais preciso ao mais tolerante:
--   1. event_at (convertido pro fuso de SP) bate com slot_date, e o
--      horário casa por prefixo ("16h30" ⊂ "16h30 – 18h30").
--   2. o rótulo textual `data` do slot bate ("25/07" ou "25/07/2026").
--   3. se a experiência tem UM único slot ativo, usa ele (cobre os
--      eventos de data única, como os artesanais).
-- Retorna null quando não dá pra casar com segurança (aí o ajuste cai
-- no contador da experiência).
create or replace function public.manual_sale_match_slot(
  p_experience_id uuid,
  p_slot_date     date,
  p_slot_time     text
)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_count integer;
  v_time  text := nullif(btrim(coalesce(p_slot_time, '')), '');
begin
  if p_experience_id is null then
    return null;
  end if;

  -- 1 + 2: casa por data (event_at ou rótulo) + horário por prefixo
  if p_slot_date is not null then
    select s.id
      into v_id
      from public.experience_slots s
     where s.experience_id = p_experience_id
       and coalesce(s.is_active, true) = true
       and (
             (s.event_at is not null
               and (s.event_at at time zone 'America/Sao_Paulo')::date = p_slot_date)
          or (s.data is not null and s.data = to_char(p_slot_date, 'DD/MM'))
          or (s.data is not null and s.data = to_char(p_slot_date, 'DD/MM/YYYY'))
           )
       and (
             v_time is null
          or s.horario ilike (v_time || '%')
          or s.horario ilike (split_part(v_time, 'h', 1) || '%')
           )
     order by s.event_at nulls last
     limit 1;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  -- 3: experiência com um único slot ativo
  select count(*), min(s.id)
    into v_count, v_id
    from public.experience_slots s
   where s.experience_id = p_experience_id
     and coalesce(s.is_active, true) = true;
  if v_count = 1 then
    return v_id;
  end if;

  return null;
end;
$$;


-- ===== 3. Ajuste forçado de vaga (slot > experiência) =====
-- Diferente das RPCs de checkout (que RECUSAM quando não há vaga), aqui
-- o ajuste é FORÇADO: a venda manual é uma decisão da admin e precisa
-- refletir a lotação real mesmo que fique negativa. Só respeita
-- "ilimitado" (vagas_total null → não mexe). Ao devolver (delta > 0),
-- não passa da capacidade (cap em vagas_total).
create or replace function public.manual_sale_adjust_vagas(
  p_slot_id       uuid,
  p_experience_id uuid,
  p_delta         integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_delta = 0 then
    return;
  end if;

  if p_slot_id is not null then
    update public.experience_slots s
       set vagas_restantes = case
             when p_delta > 0
               then least(coalesce(s.vagas_restantes, s.vagas_total) + p_delta, s.vagas_total)
               else coalesce(s.vagas_restantes, s.vagas_total) + p_delta
           end
     where s.id = p_slot_id
       and s.vagas_total is not null;
  elsif p_experience_id is not null then
    update public.experiences e
       set vagas_restantes = case
             when p_delta > 0
               then least(coalesce(e.vagas_restantes, e.vagas_total) + p_delta, e.vagas_total)
               else coalesce(e.vagas_restantes, e.vagas_total) + p_delta
           end
     where e.id = p_experience_id
       and e.vagas_total is not null;
  end if;
end;
$$;


-- ===== 4. Trigger: sincroniza estoque a cada venda manual =====
-- Uma venda manual OCUPA vaga quando payment_status é 'pago' ou
-- 'pendente' (espelha o site: pending/pago seguram estoque). A cada
-- INSERT/UPDATE/DELETE, reverte o efeito ANTIGO e aplica o NOVO — assim
-- mudar status, quantidade ou data reajusta certinho, sem contar 2x.
create or replace function public.manual_sale_sync_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_occ  boolean := false;
  v_new_occ  boolean := false;
  v_old_qty  integer := 0;
  v_new_qty  integer := 0;
  v_old_slot uuid;
  v_new_slot uuid;
begin
  -- Efeito ANTIGO (o que esta venda já tinha tirado do estoque)
  if TG_OP in ('UPDATE', 'DELETE') then
    v_old_occ  := OLD.payment_status in ('pago', 'pendente');
    v_old_qty  := greatest(coalesce(OLD.quantity, 1), 1);
    v_old_slot := coalesce(
      OLD.slot_id,
      public.manual_sale_match_slot(OLD.experience_id, OLD.slot_date, OLD.slot_time)
    );
  end if;

  -- Efeito NOVO (o que esta venda passa a tirar) + persiste slot_id
  if TG_OP in ('INSERT', 'UPDATE') then
    v_new_occ  := NEW.payment_status in ('pago', 'pendente');
    v_new_qty  := greatest(coalesce(NEW.quantity, 1), 1);
    v_new_slot := coalesce(
      NEW.slot_id,
      public.manual_sale_match_slot(NEW.experience_id, NEW.slot_date, NEW.slot_time)
    );
    NEW.slot_id := v_new_slot;
  end if;

  -- Devolve o antigo
  if v_old_occ then
    perform public.manual_sale_adjust_vagas(v_old_slot, OLD.experience_id, v_old_qty);
  end if;
  -- Tira o novo
  if v_new_occ then
    perform public.manual_sale_adjust_vagas(v_new_slot, NEW.experience_id, -v_new_qty);
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_manual_sale_sync_inventory on public.manual_sales;
create trigger trg_manual_sale_sync_inventory
  before insert or update or delete on public.manual_sales
  for each row execute function public.manual_sale_sync_inventory();


-- ===== 5. Reconciliação única (idempotente) =====
-- RECALCULA todos os contadores a partir da verdade: capacidade menos
-- (bookings pending/pago + vendas manuais pago/pendente). Corrige o
-- estado atual — inclusive o overbooking já existente — e é seguro
-- rodar mais de uma vez (recalcula do zero, não soma incremental).
create or replace function public.reconcile_all_vagas()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Slots com capacidade definida
  update public.experience_slots s
     set vagas_restantes = s.vagas_total - (
       coalesce((
         select sum(greatest(coalesce(b.quantidade, 1), 1))
           from public.bookings b
          where b.slot_id = s.id
            and b.status in ('pending', 'pago')
       ), 0)
       + coalesce((
         select sum(greatest(coalesce(ms.quantity, 1), 1))
           from public.manual_sales ms
          where ms.payment_status in ('pago', 'pendente')
            and coalesce(
                  ms.slot_id,
                  public.manual_sale_match_slot(ms.experience_id, ms.slot_date, ms.slot_time)
                ) = s.id
       ), 0)
     )
   where s.vagas_total is not null;

  -- Experiências com capacidade própria (sem slots ou vendas soltas)
  update public.experiences e
     set vagas_restantes = e.vagas_total - (
       coalesce((
         select sum(greatest(coalesce(b.quantidade, 1), 1))
           from public.bookings b
          where b.experiencia_id = e.id
            and b.slot_id is null
            and b.status in ('pending', 'pago')
       ), 0)
       + coalesce((
         select sum(greatest(coalesce(ms.quantity, 1), 1))
           from public.manual_sales ms
          where ms.experience_id = e.id
            and ms.payment_status in ('pago', 'pendente')
            and coalesce(
                  ms.slot_id,
                  public.manual_sale_match_slot(ms.experience_id, ms.slot_date, ms.slot_time)
                ) is null
       ), 0)
     )
   where e.vagas_total is not null;
end;
$$;

-- Backfill do slot_id nas vendas manuais existentes (pra cancelamentos
-- futuros devolverem a vaga certa). Não altera estoque — só rotula.
update public.manual_sales ms
   set slot_id = public.manual_sale_match_slot(ms.experience_id, ms.slot_date, ms.slot_time)
 where ms.slot_id is null
   and public.manual_sale_match_slot(ms.experience_id, ms.slot_date, ms.slot_time) is not null;

-- Roda a reconciliação agora (corrige o estado atual de uma vez).
select public.reconcile_all_vagas();

-- ===== 6. Grants =====
grant execute on function public.manual_sale_match_slot(uuid, date, text) to authenticated, service_role;
grant execute on function public.manual_sale_adjust_vagas(uuid, uuid, integer) to service_role;
grant execute on function public.reconcile_all_vagas() to service_role;

notify pgrst, 'reload schema';
