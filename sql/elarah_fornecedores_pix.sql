-- =====================================================================
-- Chave Pix do fornecedor
-- =====================================================================
-- Adiciona a coluna `pix` em fornecedores_metadata pra guardar a chave
-- Pix de cada parceiro. Usada pra fazer o repasse: aparece no card
-- "Repasses pendentes por fornecedor" na aba Compras, com botão copiar.
--
-- Aceita qualquer formato de chave (CPF/CNPJ, e-mail, telefone ou chave
-- aleatória) — guardamos como texto livre.
--
-- Aditivo e idempotente — seguro rodar em produção quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table public.fornecedores_metadata
  add column if not exists pix text;
