-- =====================================================================
-- Fase 1 — CRM operacional de fornecedores
-- =====================================================================
-- Evolui fornecedores_metadata de "tabela de metadados" para um registro
-- de relacionamento: status operacional, dados de contato e cadastro
-- manual de novos parceiros (pipeline de captação de experiências).
--
-- Aditivo e idempotente — seguro rodar em produção quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table public.fornecedores_metadata
  add column if not exists status        text not null default 'ativo',
  add column if not exists categoria     text,
  add column if not exists cidade        text,
  add column if not exists bairro        text,
  add column if not exists instagram     text,
  add column if not exists email         text,
  add column if not exists site          text,
  add column if not exists nome_contato  text;

-- Constraint do status (idempotente). Os 5 estágios operacionais:
--   ativo               — parceiro com experiências ativas
--   em_negociacao       — captação em andamento
--   aguardando_retorno  — mensagem enviada, esperando resposta
--   novas_experiencias  — parceiro mandou experiências novas pra cadastrar
--   inativo             — sem relacionamento ativo no momento
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fornecedores_metadata_status_check'
  ) then
    alter table public.fornecedores_metadata
      add constraint fornecedores_metadata_status_check
      check (status in (
        'ativo', 'em_negociacao', 'aguardando_retorno',
        'novas_experiencias', 'inativo'
      ));
  end if;
end $$;

create index if not exists fornecedores_metadata_status_idx
  on public.fornecedores_metadata (status);
