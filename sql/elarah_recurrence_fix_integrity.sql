-- =============================================================
-- ELARAH — CORREÇÃO de integridade da recorrência (PR-B)
-- -------------------------------------------------------------
-- COMO RODAR
--   1. RODE O DIAGNÓSTICO PRIMEIRO (elarah_recurrence_diagnostic.sql)
--      e confirme que Q1 e Q4 estão zero. Se Q1 > 0, ME AVISE
--      antes de rodar este arquivo.
--   2. JÁ FEZ O BACKUP? Confirma que rodou:
--        create table _backup_20260512_experience_slots as ...
--        create table _backup_20260512_experience_recurrence_rules as ...
--   3. Rode TUDO de uma vez no SQL Editor do Supabase
--      (selecione o arquivo inteiro e clica em "Run"). Está
--      envelopado em transação — se qualquer etapa falhar, rollback
--      automático.
--   4. Lê os RAISE NOTICE no painel pra confirmar contagens.
--   5. Roda o diagnóstico de novo — Q6 tem que ficar tudo zero.
--
-- O QUE ESTE SCRIPT FAZ (nesta ordem)
--   1. Cria função normalize_horario_label() — força padrão "–"
--   2. Cria trigger BEFORE INSERT/UPDATE em experience_slots
--      bloqueando cross-experience (slot.experience_id deve
--      bater com rule.experience_id quando recurrence_rule_id
--      não é NULL). IMPOSSÍVEL DE BURLAR EM INSERTS NORMAIS.
--   3. Cria trigger BEFORE INSERT/UPDATE em experience_slots
--      normalizando NEW.horario automaticamente.
--   4. Cria trigger BEFORE INSERT/UPDATE em experience_recurrence_rules
--      normalizando NEW.horario_label automaticamente.
--   5. Cria trigger AFTER UPDATE em rules: quando is_active passa
--      true→false, limpa slots futuros (deleta sem booking,
--      desvincula com booking).
--   6. Renomeia experiência "Aula de Tufting (Ter/Qui/Sex)"
--      → "Aula de Tufting (Seg/Qui)" (alinhar com weekdays reais).
--   7. Normaliza horario_label da regra ativa 449fa916
--      ("19h00 às 22h00" → "19h00 – 22h00") + slots filhos.
--   8. Trata slots da regra inativa 83176a9f:
--        - sem booking ativo → DELETE
--        - com booking ativo → recurrence_rule_id = NULL
--   9. Deleta 3 regras inativas vazias
--      (99533924, e8ae181a, 8b6b4654)
--
-- SEGURANÇA
--   - Tudo em BEGIN/COMMIT
--   - Reservas com status pending/pago NUNCA são tocadas
--   - Trigger cross-experience só RAISE — não muda dado
--   - Idempotente: rodar duas vezes = mesma coisa que uma
-- =============================================================

begin;


-- =============================================================
-- 1. FUNÇÃO normalize_horario_label
-- -------------------------------------------------------------
-- Padroniza:
--   "19h00 às 22h00"  →  "19h00 – 22h00"
--   "19h00 as 22h00"  →  "19h00 – 22h00"
--   "19h00 - 22h00"   →  "19h00 – 22h00"
--   "19h00 — 22h00"   →  "19h00 – 22h00"
--   "  19h00  às  22h00  " → "19h00 – 22h00"
--
-- Case-insensitive nas palavras (às/AS/Às etc.).
-- IMMUTABLE — pode ser usada em CHECK/INDEX se quisermos depois.
-- =============================================================
create or replace function public.normalize_horario_label(p_text text)
returns text
language sql
immutable
as $$
  select case
    when p_text is null then null
    else trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(p_text, '\s+(às|as)\s+', ' – ', 'gi'),
          '\s+[-—]\s+', ' – ', 'g'
        ),
        '\s+', ' ', 'g'
      )
    )
  end
$$;


-- =============================================================
-- 2. TRIGGER cross-experience (BLINDAGEM)
-- -------------------------------------------------------------
-- Garante em nível de BANCO que slot.experience_id sempre bate
-- com rule.experience_id quando o slot está vinculado a uma
-- regra. Não há como burlar via INSERT normal — só DISABLE
-- TRIGGER (que requer superuser).
-- =============================================================
create or replace function public.enforce_slot_rule_experience_match()
returns trigger
language plpgsql
as $$
declare
  v_rule_exp uuid;
begin
  if NEW.recurrence_rule_id is null then
    return NEW;
  end if;

  select experience_id into v_rule_exp
    from public.experience_recurrence_rules
   where id = NEW.recurrence_rule_id;

  if v_rule_exp is null then
    raise exception
      'integridade recorrência: recurrence_rule_id % não existe (slot %)',
      NEW.recurrence_rule_id, coalesce(NEW.id::text, '<novo>');
  end if;

  if v_rule_exp <> NEW.experience_id then
    raise exception
      'integridade recorrência: slot.experience_id (%) ≠ rule.experience_id (%) — recurrence_rule_id=%',
      NEW.experience_id, v_rule_exp, NEW.recurrence_rule_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_slot_rule_experience_match_trg
  on public.experience_slots;

create trigger enforce_slot_rule_experience_match_trg
  before insert or update of experience_id, recurrence_rule_id
  on public.experience_slots
  for each row execute function public.enforce_slot_rule_experience_match();


-- =============================================================
-- 3. TRIGGER normaliza experience_slots.horario
-- -------------------------------------------------------------
-- Antes de qualquer INSERT/UPDATE, força padrão no campo horario.
-- =============================================================
create or replace function public.normalize_slot_horario()
returns trigger
language plpgsql
as $$
begin
  if NEW.horario is not null then
    NEW.horario := public.normalize_horario_label(NEW.horario);
  end if;
  return NEW;
end;
$$;

drop trigger if exists normalize_slot_horario_trg
  on public.experience_slots;

-- Nome com prefixo "a_" pra rodar ANTES do enforce (alfabético).
create trigger a_normalize_slot_horario_trg
  before insert or update of horario
  on public.experience_slots
  for each row execute function public.normalize_slot_horario();


-- =============================================================
-- 4. TRIGGER normaliza experience_recurrence_rules.horario_label
-- =============================================================
create or replace function public.normalize_rule_horario_label()
returns trigger
language plpgsql
as $$
begin
  if NEW.horario_label is not null then
    NEW.horario_label := public.normalize_horario_label(NEW.horario_label);
  end if;
  return NEW;
end;
$$;

drop trigger if exists normalize_rule_horario_label_trg
  on public.experience_recurrence_rules;

create trigger normalize_rule_horario_label_trg
  before insert or update of horario_label
  on public.experience_recurrence_rules
  for each row execute function public.normalize_rule_horario_label();


-- =============================================================
-- 5. TRIGGER limpa slots quando regra é desativada
-- -------------------------------------------------------------
-- Bug que motivou o PR-B: regra desativada deixava 8 slots
-- futuros pendurados. Daqui pra frente, quando is_active
-- vai de true → false:
--   - slots futuros SEM booking → DELETE
--   - slots futuros COM booking → recurrence_rule_id = NULL
--                                  (preserva reserva, vira manual)
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

drop trigger if exists cleanup_slots_on_rule_deactivate_trg
  on public.experience_recurrence_rules;

create trigger cleanup_slots_on_rule_deactivate_trg
  after update of is_active
  on public.experience_recurrence_rules
  for each row execute function public.cleanup_slots_on_rule_deactivate();


-- =============================================================
-- 6. RENOMEIA experiência "Aula de Tufting (Ter/Qui/Sex)"
-- -------------------------------------------------------------
-- Só renomeia se ainda estiver com nome errado (idempotente).
-- =============================================================
do $$
declare
  v_id        uuid := '00000000-0000-0000-0000-000000000006';
  v_old_nome  text;
  v_new_nome  text := 'Aula de Tufting (Seg/Qui)';
begin
  select nome into v_old_nome
    from public.experiences
   where id = v_id;

  if v_old_nome is null then
    raise notice '[rename] experiência % não encontrada — pulando', v_id;
  elsif v_old_nome = v_new_nome then
    raise notice '[rename] nome já está correto (%) — pulando', v_new_nome;
  else
    update public.experiences
       set nome = v_new_nome
     where id = v_id;
    raise notice '[rename] experiência renomeada: "%" → "%"', v_old_nome, v_new_nome;
  end if;
end $$;


-- =============================================================
-- 7. NORMALIZA regra ativa 449fa916 + slots filhos
-- -------------------------------------------------------------
-- O trigger de normalização (criado na etapa 4) já roda no
-- UPDATE abaixo, então mesmo que alguém edite manualmente
-- depois, fica padronizado.
-- =============================================================
do $$
declare
  v_rule_id  uuid := '449fa916-f6d9-4c6f-adbd-71c7443dfe68';
  v_old_lbl  text;
  v_new_lbl  text;
  v_slots    integer;
begin
  select horario_label into v_old_lbl
    from public.experience_recurrence_rules
   where id = v_rule_id;

  if v_old_lbl is null then
    raise notice '[normalize-rule] regra % não encontrada — pulando', v_rule_id;
  else
    -- Update da regra (trigger normaliza)
    update public.experience_recurrence_rules
       set horario_label = public.normalize_horario_label(horario_label)
     where id = v_rule_id;

    select horario_label into v_new_lbl
      from public.experience_recurrence_rules
     where id = v_rule_id;

    -- Update dos slots filhos (trigger normaliza)
    with upd as (
      update public.experience_slots
         set horario = public.normalize_horario_label(horario)
       where recurrence_rule_id = v_rule_id
      returning 1
    )
    select count(*) into v_slots from upd;

    raise notice
      '[normalize-rule] regra %: "%" → "%" (% slots filhos atualizados)',
      v_rule_id, v_old_lbl, v_new_lbl, v_slots;
  end if;
end $$;


-- =============================================================
-- 8. TRATA slots da regra inativa 83176a9f (quinta-feira)
-- -------------------------------------------------------------
-- - SEM booking ativo → DELETE
-- - COM booking ativo (pending/pago) → recurrence_rule_id=NULL
-- Reservas ficam intactas em ambos os casos.
-- =============================================================
do $$
declare
  v_rule_id   uuid := '83176a9f-7d0a-4c87-a81f-ad2db7360bfc';
  v_deleted   integer := 0;
  v_detached  integer := 0;
  v_exists    boolean;
begin
  select exists(
    select 1 from public.experience_recurrence_rules where id = v_rule_id
  ) into v_exists;

  if not v_exists then
    raise notice '[cleanup-83176a9f] regra não existe — pulando';
  else
    -- Desvincula slots COM booking ativo (todos: futuros e passados)
    with detached as (
      update public.experience_slots s
         set recurrence_rule_id = null
       where s.recurrence_rule_id = v_rule_id
         and exists (
           select 1 from public.bookings b
           where b.slot_id = s.id
             and b.status in ('pending','pago')
         )
      returning 1
    )
    select count(*) into v_detached from detached;

    -- Deleta slots SEM booking ativo
    with deleted as (
      delete from public.experience_slots s
       where s.recurrence_rule_id = v_rule_id
         and not exists (
           select 1 from public.bookings b
           where b.slot_id = s.id
             and b.status in ('pending','pago')
         )
      returning 1
    )
    select count(*) into v_deleted from deleted;

    raise notice
      '[cleanup-83176a9f] % slots deletados (sem booking), % slots desvinculados (com booking — viraram manuais)',
      v_deleted, v_detached;
  end if;
end $$;


-- =============================================================
-- 9. DELETA 3 regras inativas vazias
-- -------------------------------------------------------------
-- Safety check: só deleta se realmente não tem slot apontando.
-- =============================================================
do $$
declare
  r_rec        record;
  v_slot_count integer;
  v_total_del  integer := 0;
  v_ids        uuid[] := array[
    '99533924-6432-4f17-848e-47480780b6d0'::uuid,
    'e8ae181a-8e78-412b-9cfa-a9dc47fa4391'::uuid,
    '8b6b4654-d0f9-4918-abe7-bf81a92df490'::uuid
  ];
  v_id         uuid;
begin
  foreach v_id in array v_ids loop
    select count(*) into v_slot_count
      from public.experience_slots
     where recurrence_rule_id = v_id;

    if v_slot_count > 0 then
      raise notice
        '[delete-rules] regra % tem % slots apontando — PULANDO por segurança',
        v_id, v_slot_count;
    else
      delete from public.experience_recurrence_rules where id = v_id;
      if found then
        v_total_del := v_total_del + 1;
        raise notice '[delete-rules] regra % deletada', v_id;
      else
        raise notice '[delete-rules] regra % já não existia', v_id;
      end if;
    end if;
  end loop;

  raise notice '[delete-rules] total deletadas: %', v_total_del;
end $$;


commit;


-- =============================================================
-- DEPOIS DE RODAR
-- -------------------------------------------------------------
-- Roda novamente o arquivo elarah_recurrence_diagnostic.sql,
-- bloco Q6, e me manda. Esperado:
--   cross_experience_BUG_CRITICO   = 0
--   duplicidade_textual_grupos     = 0
--   regras_colidindo_pares         = 0
--   slots_orfaos                   = 0
-- =============================================================
