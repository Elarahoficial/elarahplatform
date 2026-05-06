-- =============================================================
-- ELARAH — Merge da duplicata "Perséfone Lab"
-- -------------------------------------------------------------
-- Causa: duas chaves diferentes pra mesma fornecedora.
--   - 'perséfone lab' (com acento) — criada antes, tem WhatsApp,
--     data_entrada 2026-04-28 (a verdadeira)
--   - 'persefone lab' (sem acento) — criada pelo backfill que usa
--     _norm_text (unaccent), sem dados, vazia
--
-- Estratégia:
--   1. Deletar a row vazia ('persefone lab')
--   2. Re-chavear a row boa de 'perséfone lab' → 'persefone lab'
--      pra ficar consistente com o padrão moderno (sem acento)
--   3. Atualizar prospects.promoted_supplier_key que apontavam
--      pra chave antiga
--   4. Validação: 1 row, chave sem acento, dados preservados
--
-- Por que padronizar SEM acento: todas as RPCs novas
-- (find_matching_fornecedor, financial_by_supplier) usam
-- _norm_text → unaccent. Manter a chave com acento criaria
-- divergências futuras toda vez que alguém rodasse dedup.
--
-- IDEMPOTENTE: as queries são condicionadas ao estado atual.
-- Se rodar 2x, a 2ª execução não faz nada.
-- =============================================================


-- ===== 1. Deleta a duplicata vazia =====
delete from public.fornecedores_metadata
 where fornecedor_key = 'persefone lab'
   and (whatsapp is null or trim(whatsapp) = '')
   and (instagram is null or trim(instagram) = '')
   and (email is null or trim(email) = '')
   and (site is null or trim(site) = '')
   and tipo_parceria is null;


-- ===== 2. Re-chaveia a row boa pra padrão sem acento =====
-- A unique constraint não bloqueia porque a outra já foi deletada.
update public.fornecedores_metadata
   set fornecedor_key = 'persefone lab'
 where fornecedor_key = 'perséfone lab';


-- ===== 3. Atualiza referências em prospects =====
-- Se algum prospect foi promovido pra fornecedor com a chave antiga,
-- aponta pra nova. Sem isso, a coluna ficaria órfã.
update public.prospects
   set promoted_supplier_key = 'persefone lab'
 where promoted_supplier_key = 'perséfone lab';


-- ===== 4. Validação =====
-- Esperado: 1 row, fornecedor_key='persefone lab', whatsapp preservado.
select fornecedor_key,
       fornecedor_nome,
       data_entrada,
       whatsapp,
       tipo_parceria,
       prospect_id,
       created_at
from public.fornecedores_metadata
where fornecedor_nome = 'Perséfone Lab'
order by created_at;

-- Esperado: zero prospects órfãos
select count(*) as prospects_orfaos
from public.prospects p
left join public.fornecedores_metadata fm on fm.fornecedor_key = p.promoted_supplier_key
where p.promoted_supplier_key is not null
  and fm.fornecedor_key is null;

-- Esperado: nenhum nome com 2 ou mais entradas
select fornecedor_nome, count(*) as qty
from public.fornecedores_metadata
group by fornecedor_nome
having count(*) > 1;

notify pgrst, 'reload schema';
