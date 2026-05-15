-- =============================================================
-- ELARAH — Fornecedores safety net + backfill mínimo
-- -------------------------------------------------------------
-- 3 ações pra estabilizar a estrutura de fornecedores ANTES do
-- backfill manual (que depende de você dizer qual fornecedor é
-- cada experiência hoje órfã):
--
-- 1. Coloca placeholder "A definir" nas 9 experiences sem
--    fornecedor_nome — pra evitar que a trigger continue criando
--    bookings com "Desconhecido" enquanto você não preenche o
--    nome real.
--
-- 2. Adiciona CHECK constraint preventivo: experiences ativas
--    não-teste DEVEM ter fornecedor_nome não-vazio. Bloqueia
--    insert/update que tente criar exp órfã.
--
-- 3. Auto-cria fornecedores_metadata pros fornecedores que já
--    estão em uso em bookings/experiences mas ainda não têm
--    linha de metadata. Faz aparecer na aba Fornecedores
--    imediatamente, prontos pra você editar Tipo/WhatsApp/
--    Data de entrada.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- REVERSÍVEL: drops são if exists, updates são condicionados,
-- inserts usam ON CONFLICT DO NOTHING.
-- =============================================================


-- ===== 1. Placeholder "A definir" pras 9 experiences órfãs =====
-- Por que NÃO deixar NULL: a trigger bookings_autofill_fornecedor
-- tem fallback "Desconhecido" — se eu deixar NULL, qualquer nova
-- booking gera mais lixo. Com o placeholder, fica visível na
-- aba Experiências ("A definir") e o admin trata.
update public.experiences
   set fornecedor_nome = 'A definir'
 where (fornecedor_nome is null or trim(fornecedor_nome) = '')
   and coalesce(is_test, false) = false;


-- ===== 2. CHECK preventivo =====
-- A partir daqui, INSERT/UPDATE que tente deixar uma experience
-- ativa não-teste com fornecedor vazio é REJEITADO no banco.
-- A regra excluí experiências de teste (mantém flexibilidade).
alter table public.experiences
  drop constraint if exists experiences_fornecedor_nome_required;
alter table public.experiences
  add constraint experiences_fornecedor_nome_required
  check (
    coalesce(is_test, false) = true
    or coalesce(is_active, true) = false
    or (fornecedor_nome is not null and trim(fornecedor_nome) <> '')
  );


-- ===== 3. Auto-cria fornecedores_metadata pros 4 fornecedores
-- ===== em uso sem metadata =====
-- Coleta nomes distintos de fornecedor mencionados em bookings
-- (qualquer status) ou experiences ativas, que NÃO têm metadata
-- ainda. Insere com data_entrada = data da primeira aparição
-- (mais antigo entre booking e experience).
with referenciados as (
  -- Coleta nome + primeiro_uso por fornecedor
  select
    trim(fornecedor_nome)                    as nome,
    min(created_at)::date                    as primeiro_uso
  from public.bookings
  where fornecedor_nome is not null
    and trim(fornecedor_nome) <> ''
    and lower(trim(fornecedor_nome)) <> 'desconhecido'   -- não cria meta pro fantasma
    and lower(trim(fornecedor_nome)) <> 'a definir'      -- nem pro placeholder
  group by trim(fornecedor_nome)
  union all
  select
    trim(fornecedor_nome),
    coalesce(min(created_at)::date, current_date)
  from public.experiences
  where fornecedor_nome is not null
    and trim(fornecedor_nome) <> ''
    and lower(trim(fornecedor_nome)) <> 'a definir'
    and coalesce(is_test, false) = false
  group by trim(fornecedor_nome)
),
agregado as (
  select
    nome,
    min(primeiro_uso)                                                 as data_entrada,
    lower(public.unaccent(regexp_replace(nome, '\s+', ' ', 'g')))     as fornecedor_key
  from referenciados
  group by nome
)
insert into public.fornecedores_metadata (fornecedor_key, fornecedor_nome, data_entrada)
select fornecedor_key, nome, data_entrada
  from agregado
on conflict (fornecedor_key) do nothing;


-- ===== Sumário pós-execução =====
-- Validação rápida: zero experiências órfãs (a não ser test/inactive),
-- zero "A definir" sobrando se já corrigiu, e count de metadata.
select
  (select count(*) from public.experiences
    where (fornecedor_nome is null or trim(fornecedor_nome) = '')
      and coalesce(is_test, false) = false
      and coalesce(is_active, true) = true)              as exp_ainda_vazias,
  (select count(*) from public.experiences
    where lower(coalesce(fornecedor_nome, '')) = 'a definir'
      and coalesce(is_active, true) = true)              as exp_a_definir,
  (select count(*) from public.fornecedores_metadata)    as total_metadata,
  (select count(*) from public.bookings
    where lower(coalesce(fornecedor_nome, '')) = 'desconhecido')
                                                         as bookings_desconhecido_remanescentes;

notify pgrst, 'reload schema';
