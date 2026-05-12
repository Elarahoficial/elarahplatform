-- =============================================================
-- ELARAH — Blindagem contra DELETE acidental de slots de regra
-- -------------------------------------------------------------
-- Defesa em profundidade pro bug: saveSlots() do form de experiência
-- estava deletando slots de recorrência ao salvar a experiência.
--
-- Mesmo depois do fix no JS (saveSlots ignora recurrence_rule_id),
-- esta trigger BEFORE DELETE garante que nenhum outro caminho — RPC,
-- INSERT manual no SQL Editor, edge function, futuro bug — consiga
-- deletar slots vinculados a regra sem passar por fluxo autorizado.
--
-- FLUXOS AUTORIZADOS (whitelist via SET LOCAL elarah.allow_recurrence_slot_delete)
--   1. cleanup_slots_on_rule_deactivate — quando regra vira inativa
--   2. SQL de manutenção que explicitamente seta a flag local
--
-- FLUXO BLOQUEADO
--   DELETE direto via PostgREST/RPC/SQL sem setar a flag.
--
-- IDEMPOTENTE — roda quantas vezes precisar.
-- =============================================================

-- =============================================================
-- 1. Função enforce_recurrence_slot_delete
-- =============================================================
create or replace function public.enforce_recurrence_slot_delete()
returns trigger
language plpgsql
as $$
declare
  v_bypass text;
begin
  -- Slot manual: deleta livre, sem checagem.
  if OLD.recurrence_rule_id is null then
    return OLD;
  end if;

  -- Slot vinculado a regra: requer flag explícita.
  begin
    v_bypass := current_setting('elarah.allow_recurrence_slot_delete', true);
  exception when others then
    v_bypass := null;
  end;

  if coalesce(v_bypass, '') = 'true' then
    return OLD;
  end if;

  raise exception
    'integridade recorrência: DELETE de slot vinculado a regra não é permitido por essa via (slot %, rule %). Para remover slots de uma regra, desative a regra no painel "Recorrência semanal" — o cleanup automático preserva reservas pagas.',
    OLD.id, OLD.recurrence_rule_id;
end;
$$;


-- =============================================================
-- 2. Trigger BEFORE DELETE
-- =============================================================
drop trigger if exists enforce_recurrence_slot_delete_trg
  on public.experience_slots;

create trigger enforce_recurrence_slot_delete_trg
  before delete on public.experience_slots
  for each row execute function public.enforce_recurrence_slot_delete();


-- =============================================================
-- 3. Atualiza cleanup_slots_on_rule_deactivate pra setar bypass
-- -------------------------------------------------------------
-- Este trigger é chamado em AFTER UPDATE de is_active na regra.
-- Quando desativa a regra, ele DELETA slots futuros sem booking.
-- Como agora há BEFORE DELETE bloqueando, precisa autorizar via
-- set_config local (escopo da transação).
-- =============================================================
create or replace function public.cleanup_slots_on_rule_deactivate()
returns trigger
language plpgsql
as $$
declare
  v_deleted     integer := 0;
  v_detached    integer := 0;
begin
  if OLD.is_active = true and NEW.is_active = false then
    -- Autoriza DELETE de slots de regra nesta transação
    perform set_config('elarah.allow_recurrence_slot_delete', 'true', true);

    -- Desvincula slots futuros COM booking ativo
    with detached as (
      update public.experience_slots s
         set recurrence_rule_id = null
       where s.recurrence_rule_id = NEW.id
         and s.event_at >= now()
         and exists (
           select 1 from public.bookings b
           where b.slot_id = s.id
             and b.status in ('pending','pago')
         )
      returning 1
    )
    select count(*) into v_detached from detached;

    -- Deleta slots futuros SEM booking ativo
    with deleted as (
      delete from public.experience_slots s
       where s.recurrence_rule_id = NEW.id
         and s.event_at >= now()
         and not exists (
           select 1 from public.bookings b
           where b.slot_id = s.id
             and b.status in ('pending','pago')
         )
      returning 1
    )
    select count(*) into v_deleted from deleted;

    raise notice
      '[cleanup_on_deactivate] regra % desativada — % slots deletados, % slots desvinculados (viraram manuais)',
      NEW.id, v_deleted, v_detached;
  end if;

  return NEW;
end;
$$;


-- =============================================================
-- 4. Sanity check
-- -------------------------------------------------------------
-- Confirma que trigger existe:
--
--   select tgname, tgrelid::regclass, tgtype
--   from pg_trigger
--   where tgname = 'enforce_recurrence_slot_delete_trg';
--
-- Esperado: 1 linha.
-- =============================================================
