-- =============================================================
-- ELARAH — Libera EXCLUIR experiência que tem aula regular
-- -------------------------------------------------------------
-- PROBLEMA
--   No admin, o botão "Excluir" de uma experiência com Recorrência
--   semanal não fazia nada. Motivo:
--
--     1. experience_slots.experience_id tem ON DELETE CASCADE →
--        apagar a experiência manda o banco apagar as turmas dela.
--     2. a trigger enforce_recurrence_slot_delete_trg
--        (elarah_recurrence_slot_delete_guard.sql) barra o DELETE de
--        qualquer slot ligado a uma regra de recorrência, a não ser
--        que a transação tenha a flag elarah.allow_recurrence_slot_delete.
--     3. a cascata não setava essa flag → exceção → o DELETE inteiro
--        volta atrás e a experiência continua lá.
--
--   O caminho de "desativar a regra" também não resolvia: o cleanup
--   automático só apaga slots FUTUROS sem reserva. Os slots passados
--   continuam vinculados à regra, então a trava seguia valendo pra
--   sempre e a experiência ficava impossível de excluir.
--
-- SOLUÇÃO
--   Uma trigger BEFORE DELETE em public.experiences que autoriza,
--   só naquela transação, a cascata apagar os slots daquela
--   experiência. A blindagem original continua de pé pra todos os
--   outros caminhos (DELETE direto em experience_slots via
--   PostgREST, RPC, SQL manual) — o único fluxo novo permitido é
--   "estou apagando a experiência inteira, de propósito".
--
-- O QUE ACONTECE COM O HISTÓRICO
--   Nada é perdido em vendas: bookings.experiencia_id e
--   bookings.slot_id são ON DELETE SET NULL, e bookings.experiencia_nome
--   guarda o nome em texto. As reservas pagas continuam no painel e na
--   contabilidade. O que se perde é só o "link" da reserva antiga com a
--   ficha da experiência (categoria/fornecedor vindos da ficha).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- =============================================================
-- 1. Função: autoriza a cascata de slots desta transação
-- =============================================================
create or replace function public.allow_slot_cascade_on_experience_delete()
returns trigger
language plpgsql
as $$
begin
  -- Escopo local (terceiro argumento = true): vale só até o fim da
  -- transação atual. Quando o DELETE da experiência termina, a trava
  -- volta ao normal sozinha.
  perform set_config('elarah.allow_recurrence_slot_delete', 'true', true);
  return OLD;
end;
$$;


-- =============================================================
-- 2. Trigger BEFORE DELETE em experiences
-- -------------------------------------------------------------
-- BEFORE DELETE na experiência roda ANTES da cascata nos filhos,
-- que é executada por trigger AFTER da própria foreign key. Por isso
-- a flag já está setada quando os slots começam a ser apagados.
-- =============================================================
drop trigger if exists allow_slot_cascade_on_experience_delete_trg
  on public.experiences;

create trigger allow_slot_cascade_on_experience_delete_trg
  before delete on public.experiences
  for each row execute function public.allow_slot_cascade_on_experience_delete();


-- =============================================================
-- 3. Sanity check
-- -------------------------------------------------------------
-- Confirma que as DUAS triggers existem (a nova e a blindagem
-- original, que continua ativa):
--
--   select tgname, tgrelid::regclass
--     from pg_trigger
--    where tgname in ('allow_slot_cascade_on_experience_delete_trg',
--                     'enforce_recurrence_slot_delete_trg');
--
-- Esperado: 2 linhas.
-- =============================================================
