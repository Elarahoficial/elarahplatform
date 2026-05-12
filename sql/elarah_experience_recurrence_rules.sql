-- =============================================================
-- ELARAH — Recorrência semanal de experiências (Fase 1: schema)
-- -------------------------------------------------------------
-- Adiciona suporte a "agenda semanal padrão" pra experiências.
-- Em vez de cadastrar manualmente cada data, o admin define uma
-- regra (ex: "toda quinta, 19h-22h, 12 vagas") e o sistema
-- materializa slots futuros em experience_slots automaticamente.
--
-- Princípios fundamentais (todos garantidos por design + asserts):
--   1. ZERO impacto no fluxo atual. Experiências sem regra
--      funcionam exatamente como antes.
--   2. Reservas já pagas são SAGRADAS. Materialização nunca
--      altera nem remove slots com is_active=true.
--   3. Idempotente. Pode rodar várias vezes sem duplicar.
--   4. Exceções (cancelar 1 data) NÃO são "ressuscitadas":
--      slots desativados (is_active=false) continuam assim
--      mesmo após nova materialização (unique constraint
--      protege via INSERT...ON CONFLICT DO NOTHING).
--   5. RLS admin-only (mesma política das outras tabelas
--      operacionais).
--
-- PRÉ-REQUISITOS
--   - sql/elarah_supabase_setup.sql (set_updated_at, is_admin)
--   - sql/elarah_experience_slots.sql (tabela experience_slots,
--     unique index, RPCs decrement/increment_slot_vagas)
--
-- ROLLBACK
--   Em caso de problema:
--     drop function if exists public.materialize_recurrence_slots(uuid);
--     drop function if exists public.materialize_all_active_recurrences();
--     alter table public.experience_slots drop column if exists recurrence_rule_id;
--     drop table if exists public.experience_recurrence_rules cascade;
--   Slots já materializados continuam existindo (não somem).
-- =============================================================


-- =============================================================
-- 1. Coluna recurrence_rule_id em experience_slots
-- -------------------------------------------------------------
-- Marca de qual regra o slot foi materializado. NULL = slot
-- "manual" (criado pelo admin diretamente, ou legado). Permite
-- distinguir slots gerados automaticamente de manuais sem
-- ambiguidade. ON DELETE SET NULL: se a regra for removida,
-- os slots ficam preservados (viram manuais), bookings intactos.
-- =============================================================
alter table public.experience_slots
  add column if not exists recurrence_rule_id uuid;

-- Adicionada separadamente pra não falhar se a coluna já existir
-- sem a FK (cenário de upgrade parcial). Tenta criar a constraint
-- só se não existe.
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'experience_slots'
      and constraint_name = 'experience_slots_recurrence_rule_fkey'
  ) then
    -- A tabela referenciada é criada abaixo. Vamos adicionar a FK
    -- DEPOIS de criar a tabela (mais abaixo no script).
    null;
  end if;
end $$;


-- =============================================================
-- 2. Tabela experience_recurrence_rules
-- -------------------------------------------------------------
-- 1 experiência pode ter N regras (ex: terça + quinta + sábado).
-- Cada regra define um dia da semana, horário e vagas. O sistema
-- materializa os próximos N slots semanais em experience_slots.
-- =============================================================
create table if not exists public.experience_recurrence_rules (
  id              uuid primary key default gen_random_uuid(),
  experience_id   uuid not null references public.experiences(id) on delete cascade,

  -- Dia da semana (0=domingo, 1=segunda, ..., 6=sábado).
  -- Convenção do PostgreSQL `extract(dow from date)`.
  weekday         integer not null check (weekday between 0 and 6),

  -- Horário (formato "HH:MM:SS" pro cálculo de event_at).
  -- hora_fim é opcional — alguns workshops têm só hora de início.
  hora_inicio     time not null,
  hora_fim        time,

  -- Rótulo de display ("19h00 – 22h00"). Vai pro slot.horario.
  -- Editável separadamente pra cobrir variações de formato.
  horario_label   text not null,

  -- Capacidade da turma (cada slot materializado herda esse valor).
  -- > 0 obrigatório (sem suporte a "ilimitado" via recorrência —
  -- isso é caso raro e admin cria manual).
  vagas_total     integer not null check (vagas_total > 0),

  -- Horizonte de materialização (em semanas). Padrão 8.
  -- Aumentar = mais slots no banco; diminuir = cliente vê menos
  -- datas no futuro. Sempre re-materializado pelo cron diário.
  horizon_weeks   integer not null default 8 check (horizon_weeks between 1 and 52),

  -- Soft-delete: desativar a regra pausa a materialização de
  -- novos slots. Slots já materializados ficam (pra honrar
  -- reservas já feitas em datas futuras).
  is_active       boolean not null default true,

  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Cobre as queries principais: listar regras de 1 experiência;
-- materializar todas as ativas.
create index if not exists idx_recurrence_rules_exp
  on public.experience_recurrence_rules (experience_id, is_active);

create index if not exists idx_recurrence_rules_active
  on public.experience_recurrence_rules (is_active)
  where is_active = true;

-- Trigger updated_at (reusa função existente)
drop trigger if exists set_recurrence_rules_updated_at on public.experience_recurrence_rules;
create trigger set_recurrence_rules_updated_at
  before update on public.experience_recurrence_rules
  for each row execute function public.set_updated_at();


-- =============================================================
-- 3. FK recurrence_rule_id (agora que a tabela existe)
-- -------------------------------------------------------------
-- ON DELETE SET NULL: se a regra é apagada, slots viram
-- "manuais" mas continuam ativos. Bookings em cima deles
-- preservados.
-- =============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'experience_slots'
      and constraint_name = 'experience_slots_recurrence_rule_fkey'
  ) then
    alter table public.experience_slots
      add constraint experience_slots_recurrence_rule_fkey
      foreign key (recurrence_rule_id)
      references public.experience_recurrence_rules(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_slots_recurrence_rule
  on public.experience_slots (recurrence_rule_id)
  where recurrence_rule_id is not null;


-- =============================================================
-- 4. RLS — só admin pode gerenciar regras
-- =============================================================
alter table public.experience_recurrence_rules enable row level security;

drop policy if exists "recurrence_rules_admin_all" on public.experience_recurrence_rules;
create policy "recurrence_rules_admin_all"
  on public.experience_recurrence_rules
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================
-- 5. Função materialize_recurrence_slots(rule_id)
-- -------------------------------------------------------------
-- Cria os slots futuros pra UMA regra. Lógica:
--
--   - Itera por horizon_weeks semanas a partir de hoje
--   - Calcula a próxima data correspondente ao weekday da regra
--   - Pra cada data: faz INSERT em experience_slots com
--     ON CONFLICT DO NOTHING
--
-- Garantias:
--
--   ✅ Idempotente: rodar 2x não duplica nada (unique constraint
--     já protege via experience_slots_uq).
--
--   ✅ Slots existentes não são alterados: ON CONFLICT DO NOTHING
--     respeita qualquer estado atual — slot ativo com reservas,
--     slot desativado (exceção/cancelamento), slot manual com
--     vagas_total diferente, tudo preservado.
--
--   ✅ Cancelamentos não voltam: se admin marcou slot
--     is_active=false (cancelou aquela quinta específica),
--     a próxima materialização não recria nem ativa.
--
--   ✅ Past slots não são criados: só materializa datas >= hoje.
--
-- Retorna: número de slots NOVOS criados (0 = já estava tudo
-- materializado, normal em re-runs).
-- =============================================================
create or replace function public.materialize_recurrence_slots(p_rule_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule      public.experience_recurrence_rules%rowtype;
  v_today     date := current_date;
  v_dow_today integer;
  v_offset    integer;
  v_target    date;
  v_event_at  timestamptz;
  v_data_lbl  text;
  v_inserted  integer := 0;
  v_step      integer;
begin
  select * into v_rule
    from public.experience_recurrence_rules
   where id = p_rule_id;

  if not found then
    return 0;
  end if;

  -- Regra desativada não materializa nada. Slots já criados
  -- ficam (pra preservar reservas eventuais).
  if not v_rule.is_active then
    return 0;
  end if;

  -- Calcula offset em dias até o próximo dia da semana alvo.
  -- extract(dow) retorna 0=domingo … 6=sábado (mesma convenção
  -- usada em weekday). Se for hoje, mantém offset=0.
  v_dow_today := extract(dow from v_today)::int;
  v_offset := (v_rule.weekday - v_dow_today + 7) % 7;

  -- Loop pelas próximas N semanas
  for v_step in 0 .. (v_rule.horizon_weeks - 1) loop
    v_target := v_today + (v_offset + v_step * 7);

    -- Compõe event_at em timezone America/Sao_Paulo. Usar
    -- timezone explícito evita confusão se o cliente Postgres
    -- estiver em outro fuso.
    v_event_at := (v_target::text || ' ' || v_rule.hora_inicio::text)
                    ::timestamp at time zone 'America/Sao_Paulo';

    -- Rótulo "DD/MM" pra compatibilidade com schema legado
    v_data_lbl := to_char(v_target, 'DD/MM');

    -- INSERT idempotente. Slots existentes (criados antes pela
    -- mesma regra OU manualmente OU desativados como exceção)
    -- são preservados — não tocamos em nada.
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

    -- GET DIAGNOSTICS pra contar quantos foram efetivamente
    -- inseridos (vs ignorados por conflict).
    if found then
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return v_inserted;
end;
$$;


-- =============================================================
-- 6. Função materialize_all_active_recurrences()
-- -------------------------------------------------------------
-- Materializa todas as regras ativas. Usada pelo cron diário
-- (Fase 3) pra manter o horizon sempre cheio conforme o tempo
-- passa. Idempotente — rodar várias vezes só cria os que faltam.
--
-- Retorna: total de slots criados nessa execução.
-- =============================================================
create or replace function public.materialize_all_active_recurrences()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule_id  uuid;
  v_total    integer := 0;
  v_count    integer;
begin
  for v_rule_id in
    select id from public.experience_recurrence_rules where is_active = true
  loop
    v_count := public.materialize_recurrence_slots(v_rule_id);
    v_total := v_total + coalesce(v_count, 0);
  end loop;
  return v_total;
end;
$$;


-- =============================================================
-- 7. Trigger AFTER INSERT/UPDATE: auto-materializa
-- -------------------------------------------------------------
-- Quando admin cria/atualiza uma regra, materializa
-- automaticamente os slots futuros. Sem isso, admin teria que
-- chamar a função manualmente todo save.
--
-- DELETE: não dispara nada — ON DELETE SET NULL no slot
-- garante que slots órfãos viram "manuais" e continuam vivos.
-- =============================================================
create or replace function public.trigger_materialize_recurrence()
returns trigger
language plpgsql
as $$
begin
  -- Só materializa se a regra está ativa. Soft-delete (ativa->
  -- inativa) não tenta gerar nada novo.
  if NEW.is_active then
    perform public.materialize_recurrence_slots(NEW.id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists materialize_recurrence_after_change on public.experience_recurrence_rules;
create trigger materialize_recurrence_after_change
  after insert or update of weekday, hora_inicio, horario_label, vagas_total,
                            horizon_weeks, is_active
  on public.experience_recurrence_rules
  for each row execute function public.trigger_materialize_recurrence();


-- =============================================================
-- 8. Permissões (RPC callable pelo admin)
-- =============================================================
grant execute on function public.materialize_recurrence_slots(uuid) to authenticated;
grant execute on function public.materialize_all_active_recurrences() to authenticated;


-- =============================================================
-- 9. Sanity check / verificação
-- -------------------------------------------------------------
-- Roda essa query depois de aplicar pra confirmar que tudo foi
-- criado certo:
--
--   select
--     (select count(*) from public.experience_recurrence_rules) as regras_atuais,
--     (select count(*) from public.experience_slots where recurrence_rule_id is not null) as slots_recorrentes,
--     (select count(*) from pg_proc where proname = 'materialize_recurrence_slots') as funcao_existe;
--
-- Esperado em banco virgem após este SQL:
--   regras_atuais = 0  (admin ainda não cadastrou nenhuma)
--   slots_recorrentes = 0  (sem regras, sem slots gerados)
--   funcao_existe = 1  (função criada)
--
-- TESTE FUNCIONAL ISOLADO (não afeta produção — pode rodar):
--
--   -- 1. Cria regra de teste (substitua o experience_id por um real)
--   insert into public.experience_recurrence_rules (
--     experience_id, weekday, hora_inicio, horario_label, vagas_total
--   ) values (
--     '<UUID_DE_UMA_EXPERIÊNCIA_DE_TESTE>',
--     4,           -- quinta-feira
--     '19:00:00',
--     '19h00 – 22h00',
--     12
--   );
--
--   -- 2. Conferir slots gerados automaticamente pela trigger
--   select data, horario, vagas_total, is_active, event_at
--   from public.experience_slots
--   where recurrence_rule_id = (
--     select id from public.experience_recurrence_rules
--     order by created_at desc limit 1
--   )
--   order by event_at;
--
--   -- Esperado: 8 linhas (horizon padrão), uma por semana, todas
--   -- ativas, vagas_total=12, event_at em quintas futuras.
--
--   -- 3. Limpa o teste
--   delete from public.experience_recurrence_rules
--   where id = (
--     select id from public.experience_recurrence_rules
--     order by created_at desc limit 1
--   );
--   -- Os slots permanecem como "manuais" (recurrence_rule_id = NULL)
--   -- mas ainda ativos. Pra limpar tudo:
--   --   delete from public.experience_slots where vagas_total = 12 and horario = '19h00 – 22h00';
-- =============================================================
