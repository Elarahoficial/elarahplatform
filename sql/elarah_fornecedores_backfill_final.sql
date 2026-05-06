-- =============================================================
-- ELARAH — Backfill final dos fornecedores
-- -------------------------------------------------------------
-- Aplica os mapeamentos confirmados pelo admin pra resolver
-- definitivamente:
--   - 4 experiences ativas que estavam com placeholder "A definir"
--   - 5 experiences seed/legacy (UUIDs hardcoded + 1 inativa)
--   - 3 bookings com fornecedor "Desconhecido"
--
-- Mapeamentos confirmados:
--   ffa210dc → Perséfone Lab        (Workshop de Ourivesaria)
--   5d2a4ca9 → Shoyu Crafts         (Cerâmica em Torno 04/05)
--   d2f000df → Lab Botanic          (Oficina de Perfumaria)
--   2c11e3a5 → Sarques              (Pintura de Quadro)
--
-- Seed/legacy → marcadas como is_test = true (saem dos relatórios
-- mas permanecem no banco com histórico):
--   00000000-0000-0000-0000-000000000001  Vela inativa
--   00000000-0000-0000-0000-000000000002  Pintura em Cerâmica
--   00000000-0000-0000-0000-000000000010  Cerâmica em Torno inativa
--   00000000-0000-0000-0000-000000000011  Cerâmica em Torno ativa
--   777b739c-d1e3-499a-8716-27c4708918bc  Vela inativa real
--
-- Booking "teste" sem experiencia_id → marcada como Teste:
--   16f13143-d34d-4da0-8b6c-8e55efbdf2b6 (R$ 2,40)
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar (updates são
-- condicionais e ON CONFLICT DO NOTHING).
-- =============================================================


-- ===== 1. Atualiza fornecedor_nome nas 4 experiences ativas =====
update public.experiences
   set fornecedor_nome = 'Perséfone Lab'
 where id = 'ffa210dc-6adf-430e-8ca9-46b495d37295'
   and lower(coalesce(fornecedor_nome, '')) = 'a definir';

update public.experiences
   set fornecedor_nome = 'Shoyu Crafts'
 where id = '5d2a4ca9-e02f-438f-b71a-23a62865e6c9'
   and lower(coalesce(fornecedor_nome, '')) = 'a definir';

update public.experiences
   set fornecedor_nome = 'Lab Botanic'
 where id = 'd2f000df-7691-4319-a4a1-f87220e6a636'
   and lower(coalesce(fornecedor_nome, '')) = 'a definir';

update public.experiences
   set fornecedor_nome = 'Sarques'
 where id = '2c11e3a5-77fc-46af-90cf-14ed22e21825'
   and lower(coalesce(fornecedor_nome, '')) = 'a definir';


-- ===== 2. Marca seed/legacy como is_test =====
-- 4 experiences com UUID hardcoded (dev seed) + 1 vela inativa real.
-- Mantém o registro pra histórico mas exclui de todos os relatórios
-- (financeiro, fornecedores, prospects).
update public.experiences
   set is_test = true,
       fornecedor_nome = coalesce(nullif(trim(fornecedor_nome), ''), 'Legacy / Seed')
 where id in (
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000011',
   '777b739c-d1e3-499a-8716-27c4708918bc'
 );


-- ===== 3. Backfill bookings "Desconhecido" =====
-- As bookings 5b599c7b (Lab Botanic) e 7c60edee (Sarques) tinham
-- fornecedor_nome="Desconhecido" porque a trigger rodou quando a
-- experience estava sem fornecedor. Agora que a experience foi
-- corrigida, atualizamos a booking pra apontar pro fornecedor real.
--
-- IMPORTANTE: também atualiza o snapshot em repasses[] (jsonb)
-- quando existir, pra que financial_by_supplier dedupe corretamente.

-- Booking 1 (R$ 299 — Lab Botanic)
update public.bookings
   set fornecedor_nome = 'Lab Botanic',
       repasses = case
         when repasses is null then null
         when jsonb_typeof(repasses) <> 'array' or jsonb_array_length(repasses) = 0 then repasses
         else jsonb_build_array(jsonb_set(repasses -> 0, '{fornecedor_nome}', '"Lab Botanic"'))
       end
 where id = '5b599c7b-4ec0-499d-8b3e-f2e9f443b5c9'
   and lower(coalesce(fornecedor_nome, '')) = 'desconhecido';

-- Booking 3 (R$ 598 — Sarques)
update public.bookings
   set fornecedor_nome = 'Sarques',
       repasses = case
         when repasses is null then null
         when jsonb_typeof(repasses) <> 'array' or jsonb_array_length(repasses) = 0 then repasses
         else jsonb_build_array(jsonb_set(repasses -> 0, '{fornecedor_nome}', '"Sarques"'))
       end
 where id = '7c60edee-948c-4381-896a-867eb1caea25'
   and lower(coalesce(fornecedor_nome, '')) = 'desconhecido';

-- Booking 2 (R$ 2,40 — Teste)
-- Não tem experiencia_id, é puramente de checkout test.
-- Marca como "Teste" pra sair de "Desconhecido" e fica visualmente
-- distinto. Não é um fornecedor real e não vai criar metadata.
update public.bookings
   set fornecedor_nome = 'Teste',
       repasses = null      -- garante que não atribui repasse pra ninguém
 where id = '16f13143-d34d-4da0-8b6c-8e55efbdf2b6'
   and lower(coalesce(fornecedor_nome, '')) = 'desconhecido';


-- ===== 4. Auto-cria metadata pros 4 novos fornecedores =====
-- Mesma lógica do safety_net mas focada nos novos nomes. Garante
-- que aparecem na aba Fornecedores com data_entrada = primeira
-- aparição em booking/experience.
with novos as (
  select
    nome,
    min(data)::date                                                  as data_entrada,
    lower(public.unaccent(regexp_replace(nome, '\s+', ' ', 'g')))    as fornecedor_key
  from (
    select 'Perséfone Lab' as nome, current_date as data
    union all
    select 'Shoyu Crafts',  current_date
    union all
    select 'Lab Botanic',   current_date
    union all
    select 'Sarques',       current_date
    union all
    -- Cruzar com bookings/exp pra pegar a data real de primeira aparição
    select e.fornecedor_nome, e.created_at
      from public.experiences e
     where e.fornecedor_nome in ('Perséfone Lab','Shoyu Crafts','Lab Botanic','Sarques')
    union all
    select b.fornecedor_nome, b.created_at
      from public.bookings b
     where b.fornecedor_nome in ('Perséfone Lab','Shoyu Crafts','Lab Botanic','Sarques')
  ) src
  group by nome
)
insert into public.fornecedores_metadata (fornecedor_key, fornecedor_nome, data_entrada)
select fornecedor_key, nome, data_entrada from novos
on conflict (fornecedor_key) do nothing;


-- ===== 5. Validação pós-execução =====
-- Esperado:
--   bookings_desconhecido = 0
--   experiencias_a_definir_ativas = 0
--   fornecedores_novos_em_metadata = 4 (todos com row criada)
--   bookings_com_teste = 1 (a de R$ 2,40)
select
  -- Não pode sobrar nenhuma "Desconhecido"
  (select count(*) from public.bookings
    where lower(coalesce(fornecedor_nome,'')) = 'desconhecido')        as bookings_desconhecido,

  -- Nem "A definir" entre as ativas
  (select count(*) from public.experiences
    where lower(coalesce(fornecedor_nome,'')) = 'a definir'
      and coalesce(is_active, true) = true
      and coalesce(is_test, false) = false)                            as experiencias_a_definir_ativas,

  -- 4 fornecedores novos têm metadata
  (select count(*) from public.fornecedores_metadata
    where fornecedor_nome in ('Perséfone Lab','Shoyu Crafts','Lab Botanic','Sarques')) as fornecedores_novos_em_metadata,

  -- Booking marcada como Teste
  (select count(*) from public.bookings
    where lower(coalesce(fornecedor_nome,'')) = 'teste'
      and id = '16f13143-d34d-4da0-8b6c-8e55efbdf2b6')                 as booking_teste_marcada,

  -- Seed/legacy todas com is_test=true
  (select count(*) from public.experiences
    where id in (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000010',
      '00000000-0000-0000-0000-000000000011',
      '777b739c-d1e3-499a-8716-27c4708918bc'
    ) and coalesce(is_test, false) = true)                             as legacy_marcadas_como_teste;

-- Esperado da query acima: 0, 0, 4, 1, 5

notify pgrst, 'reload schema';
