-- =====================================================================
-- Onde o parceiro atende: espaço próprio ou vai até o local
-- =====================================================================
-- Adiciona `local_atendimento` em fornecedores_metadata. Serve pro
-- filtro da aba Cotação: saber quem NÃO tem ateliê/espaço e precisa
-- ir até um café, bar ou espaço de evento.
--
--   'espaco_proprio' → tem ateliê/espaço próprio
--   'vai_ate_local'  → não tem espaço, vai até o local
--   'ambos'          → tem espaço e também vai até o local
--   null             → ainda não informado
--
-- Preenchido pela própria Cotação (marcação rápida no card) ou pelo
-- cadastro do parceiro na aba Fornecedores.
--
-- Aditivo e idempotente — seguro rodar em produção quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table public.fornecedores_metadata
  add column if not exists local_atendimento text;

alter table public.fornecedores_metadata
  drop constraint if exists fornecedores_metadata_local_atendimento_check;

alter table public.fornecedores_metadata
  add constraint fornecedores_metadata_local_atendimento_check
  check (
    local_atendimento is null
    or local_atendimento in ('espaco_proprio', 'vai_ate_local', 'ambos')
  );
