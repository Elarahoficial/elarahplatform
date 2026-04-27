-- =============================================================
-- ELARAH — WhatsApp do fornecedor por experiência
-- -------------------------------------------------------------
-- Adiciona coluna fornecedor_whatsapp em public.experiences.
-- Usada no painel "Compras" do admin pra abrir uma conversa no
-- WhatsApp do fornecedor com mensagem pré-pronta de aviso de
-- aluno confirmado.
--
-- Idempotente. Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

alter table public.experiences
  add column if not exists fornecedor_whatsapp text;

-- Diagnóstico (opcional): lista experiências e o que está cadastrado.
-- select id, nome, fornecedor_nome, fornecedor_whatsapp
--   from public.experiences
--  order by nome;
