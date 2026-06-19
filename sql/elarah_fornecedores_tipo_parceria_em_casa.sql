-- =====================================================================
-- Tipo de parceria multi-vertente (Elarah / By Elarah / Elarah em casa)
-- =====================================================================
-- Antes, tipo_parceria aceitava só um valor: 'elarah', 'byelarah' ou
-- 'ambos'. Agora um fornecedor pode pertencer a UMA OU MAIS vertentes,
-- guardadas como chaves separadas por vírgula. Ex.:
--   'elarah'                  → Elarah
--   'elarah,em_casa'          → Elarah + Elarah em casa
--   'elarah,byelarah,em_casa' → todas as três
-- O legado 'ambos' (= elarah + byelarah) continua aceito.
--
-- Esta migração troca o CHECK pra aceitar a nova vertente 'em_casa' e
-- combinações. Aditiva e idempotente — segura rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table public.fornecedores_metadata
  drop constraint if exists fornecedores_metadata_tipo_parceria_check;

alter table public.fornecedores_metadata
  add constraint fornecedores_metadata_tipo_parceria_check
  check (
    tipo_parceria is null
    or tipo_parceria ~ '^(elarah|byelarah|em_casa|ambos)(,(elarah|byelarah|em_casa|ambos))*$'
  );
