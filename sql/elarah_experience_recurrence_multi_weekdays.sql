-- =============================================================
-- ELARAH — Recorrência semanal: múltiplos dias por regra
-- -------------------------------------------------------------
-- Suplemento à migration Fase 1 (elarah_experience_recurrence_rules.sql).
-- Transforma `weekday integer` em `weekdays integer[]`, permitindo
-- que UMA regra cobra vários dias da semana com o mesmo horário e
-- vagas (ex: "terça + quinta + sexta às 19h, 12 vagas" em vez de
-- 3 regras separadas).
--
-- MIGRATION SEGURA
--   - Adiciona coluna nova `weekdays integer[]` (nullable inicialmente)
--   - Backfill: weekdays = ARRAY[weekday] pra regras existentes
--   - Marca NOT NULL após backfill
--   - DROP coluna antiga `weekday`
--   - Atualiza CHECK constraint pra validar TODOS os elementos
--   - Reescreve função materialize_recurrence_slots pra iterar
--     pelos weekdays
--   - Atualiza trigger pra usar weekdays
--
-- IDEMPOTENTE
--   Roda quantas vezes precisar. Cada bloco checa estado antes.
--   Se já rodou antes (weekday já não existe), pula limpo.
--
-- ROLLBACK (em caso de problema)
--   alter table public.experience_recurrence_rules
--     add column if not exists weekday integer;
--   update public.experience_recurrence_rules
--     set weekday = weekdays[1] where weekday is null and weekdays is not null;
--   alter table public.experience_recurrence_rules drop column weekdays;
--   -- depois rode novamente a versão Fase 1 do arquivo
-- =============================================================


-- =============================================================
-- 1. Adiciona coluna weekdays integer[] (nullable nesta fase)
-- =============================================================
alter table public.experience_recurrence_rules
  add column if not exists weekdays integer[];


-- =============================================================
-- 2. Backfill — copia weekday → weekdays como array de 1 elemento
-- -------------------------------------------------------------
-- Só preenche se weekdays está vazio (idempotente).
-- =============================================================
do $$
declare
  v_old_col_exists boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'experience_recurrence_rules'
      and column_name = 'weekday'
  ) into v_old_col_exists;

  if v_old_col_exists then
    execute $sql$
      update public.experience_recurrence_rules
         set weekdays = array[weekday]
       where weekdays is null
         and weekday is not null
    $sql$;
  end if;
end $$;


-- =============================================================
-- 3. NOT NULL + CHECK constraint validando todos os elementos
-- -------------------------------------------------------------
-- Cada valor do array deve estar entre 0 e 6 (mesma convenção
-- do PostgreSQL extract(dow)). Pelo menos 1 dia obrigatório.
-- =============================================================
do $$
begin
  -- Marca NOT NULL só se ainda permite null e tem dados consistentes
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'experience_recurrence_rules'
      and column_name = 'weekdays'
      and is_nullable = 'YES'
  ) then
    -- Confirma que não tem regras com weekdays null antes de
    -- promover a NOT NULL (evita erro se houver linhas órfãs)
    if not exists (
      select 1 from public.experience_recurrence_rules where weekdays is null
    ) then
      alter table public.experience_recurrence_rules
        alter column weekdays set not null;
    end if;
  end if;
end $$;

-- CHECK: array não-vazio + todos elementos entre 0 e 6.
-- PostgreSQL não aceita subquery em CHECK constraint, então usa o
-- operador `<@` ("está contido em"): weekdays <@ array[0,1,2,3,4,5,6]
-- garante que TODOS os elementos do array estão no conjunto válido.
-- Como bônus, limita o tamanho a 7 (não dá pra ter mais que 7 dias
-- da semana únicos no array).
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'experience_recurrence_rules'
      and constraint_name = 'recurrence_rules_weekdays_valid'
  ) then
    alter table public.experience_recurrence_rules
      add constraint recurrence_rules_weekdays_valid
      check (
        array_length(weekdays, 1) >= 1
        and array_length(weekdays, 1) <= 7
        and weekdays <@ array[0,1,2,3,4,5,6]
      );
  end if;
end $$;


-- =============================================================
-- 4. DROP coluna antiga `weekday`
-- -------------------------------------------------------------
-- Só dropa se ainda existe (idempotente). Se já foi removida em
-- run anterior, pula sem erro.
-- =============================================================
alter table public.experience_recurrence_rules
  drop column if exists weekday;


-- =============================================================
-- 5. Atualiza função materialize_recurrence_slots
-- -------------------------------------------------------------
-- Itera pelos weekdays do array E pelas semanas do horizon.
-- Pra cada combinação (weekday, semana_offset), calcula a data
-- alvo e tenta INSERT com ON CONFLICT DO NOTHING (idempotente).
--
-- Garantias preservadas (mesmas da Fase 1):
--   ✅ Idempotente — ON CONFLICT DO NOTHING
--   ✅ Nunca toca slots existentes (preserva exceções e reservas)
--   ✅ Cancelamentos (is_active=false) não voltam
--   ✅ Past slots não são criados
-- =============================================================
create or replace function public.materialize_recurrence_slots(p_rule_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule       public.experience_recurrence_rules%rowtype;
  v_today      date := current_date;
  v_dow_today  integer;
  v_target_wd  integer;
  v_offset     integer;
  v_target     date;
  v_event_at   timestamptz;
  v_data_lbl   text;
  v_inserted   integer := 0;
  v_step       integer;
begin
  select * into v_rule
    from public.experience_recurrence_rules
   where id = p_rule_id;

  if not found then
    return 0;
  end if;
  if not v_rule.is_active then
    return 0;
  end if;

  v_dow_today := extract(dow from v_today)::int;

  -- Loop externo: cada dia da semana incluído na regra
  foreach v_target_wd in array v_rule.weekdays loop
    v_offset := (v_target_wd - v_dow_today + 7) % 7;

    -- Loop interno: cada semana dentro do horizon
    for v_step in 0 .. (v_rule.horizon_weeks - 1) loop
      v_target := v_today + (v_offset + v_step * 7);

      v_event_at := (v_target::text || ' ' || v_rule.hora_inicio::text)
                      ::timestamp at time zone 'America/Sao_Paulo';
      v_data_lbl := to_char(v_target, 'DD/MM');

      insert into public.experience_slots (
        experience_id, data, horario, vagas_total, event_at,
        recurrence_rule_id, is_active
      )
      values (
        v_rule.experience_id, v_data_lbl, v_rule.horario_label,
        v_rule.vagas_total, v_event_at,
        v_rule.id, true
      )
      on conflict (experience_id, coalesce(data, ''), horario) do nothing;

      if found then
        v_inserted := v_inserted + 1;
      end if;
    end loop;
  end loop;

  return v_inserted;
end;
$$;


-- =============================================================
-- 6. Trigger — atualiza pra incluir weekdays nas colunas observadas
-- -------------------------------------------------------------
-- DROP + CREATE pra garantir que pega a nova lista de colunas
-- (UPDATE OF é fixado no momento do CREATE).
-- =============================================================
drop trigger if exists materialize_recurrence_after_change on public.experience_recurrence_rules;
create trigger materialize_recurrence_after_change
  after insert or update of weekdays, hora_inicio, horario_label, vagas_total,
                            horizon_weeks, is_active
  on public.experience_recurrence_rules
  for each row execute function public.trigger_materialize_recurrence();


-- =============================================================
-- 7. Sanity check
-- -------------------------------------------------------------
-- Roda essa query depois pra confirmar:
--
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name = 'experience_recurrence_rules'
--     and column_name in ('weekday', 'weekdays');
--
-- Esperado:
--   weekdays | ARRAY | NO
--   (weekday NÃO deve aparecer — foi dropada)
-- =============================================================
