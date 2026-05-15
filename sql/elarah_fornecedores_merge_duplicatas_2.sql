-- =============================================================
-- ELARAH — Merge das duplicatas Ateliê Meu Outro Lado + Méva
-- -------------------------------------------------------------
-- Mesmo padrão da Perséfone Lab (PR #159): row antiga com chave
-- acentuada + dados, row nova sem acento e vazia. Causa: mudança
-- da função de normalização (safety_net usa unaccent).
--
-- Rows:
--   'ateliê meu outro lado' → MANTER (criada 27/04, WhatsApp,
--                                      data_entrada 10/03)
--   'atelie meu outro lado' → DELETAR (criada 06/05, vazia)
--   'méva'                  → MANTER (criada 28/04, WhatsApp,
--                                      data_entrada 03/04)
--   'meva'                  → DELETAR (criada 06/05, vazia)
--
-- Estratégia:
--   1. DELETE das rows vazias (condicionadas a estar 100% vazias)
--   2. UPDATE re-chaveia rows boas pra padrão sem acento
--   3. UPDATE prospects.promoted_supplier_key se houver
--   4. Validações (3 queries esperando 0 duplicatas)
--
-- IDEMPOTENTE: condições garantem no-op em re-runs.
-- =============================================================


-- ===== 1. Deleta as duplicatas vazias =====
delete from public.fornecedores_metadata
 where fornecedor_key in ('atelie meu outro lado', 'meva')
   and (whatsapp is null or trim(whatsapp) = '')
   and (instagram is null or trim(instagram) = '')
   and (email is null or trim(email) = '')
   and (site is null or trim(site) = '')
   and tipo_parceria is null;


-- ===== 2. Re-chaveia as rows boas =====
update public.fornecedores_metadata
   set fornecedor_key = 'atelie meu outro lado'
 where fornecedor_key = 'ateliê meu outro lado';

update public.fornecedores_metadata
   set fornecedor_key = 'meva'
 where fornecedor_key = 'méva';


-- ===== 3. Atualiza prospects que apontavam pras chaves antigas =====
update public.prospects
   set promoted_supplier_key = 'atelie meu outro lado'
 where promoted_supplier_key = 'ateliê meu outro lado';

update public.prospects
   set promoted_supplier_key = 'meva'
 where promoted_supplier_key = 'méva';


-- ===== 4. Validação =====
-- Esperado: 1 row de cada, com WhatsApp e data preservados,
-- chave sem acento.
select fornecedor_key,
       fornecedor_nome,
       data_entrada,
       whatsapp,
       tipo_parceria,
       created_at
from public.fornecedores_metadata
where fornecedor_nome in ('Ateliê Meu Outro Lado', 'Méva')
order by fornecedor_nome;

-- Esperado: zero prospects órfãos
select count(*) as prospects_orfaos
from public.prospects p
left join public.fornecedores_metadata fm on fm.fornecedor_key = p.promoted_supplier_key
where p.promoted_supplier_key is not null
  and fm.fornecedor_key is null;

-- Esperado: nenhum nome com 2+ entradas (varredura completa)
select fornecedor_nome, count(*) as qty
from public.fornecedores_metadata
group by fornecedor_nome
having count(*) > 1;

-- Bônus: confere que NENHUMA chave ainda contém caracter acentuado
-- (regex pega caracteres não-ASCII). Se vier vazio, está limpo.
select fornecedor_key, fornecedor_nome
from public.fornecedores_metadata
where fornecedor_key ~ '[^\x00-\x7f]'
order by fornecedor_key;

notify pgrst, 'reload schema';
