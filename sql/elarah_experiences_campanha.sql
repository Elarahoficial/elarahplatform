-- =============================================================
-- ELARAH — Campanha (data especial) em experiences
-- -------------------------------------------------------------
-- Adiciona a coluna `campanha` em public.experiences pra marcar
-- uma experiência como parte de uma campanha temática (Dia dos
-- Pais, Dia das Mães, etc). As abas temáticas (ex.: dia-dos-pais.html)
-- listam exatamente as experiências marcadas com o slug da campanha.
--
--   campanha = null / '' → experiência normal (não entra em campanha)
--   campanha = 'dia-dos-pais'      → aparece em dia-dos-pais.html
--   campanha = 'dia-das-maes'      → aparece em dia-das-maes.html
--   campanha = 'dia-dos-namorados' → aparece em dia-dos-namorados.html
--   (o valor é o slug escolhido no seletor "Campanha" do painel admin)
--
-- Default null garante retrocompatibilidade: todas as experiências
-- existentes continuam sem campanha até serem marcadas no painel.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
-- =============================================================

alter table public.experiences
  add column if not exists campanha text;

-- Index parcial pra acelerar a query "todas as experiências de uma
-- campanha" usada no render das abas temáticas. Só indexa as linhas
-- que têm campanha marcada (a maioria não tem).
create index if not exists idx_experiences_campanha
  on public.experiences (campanha)
  where campanha is not null;

-- Refresh do cache do PostgREST pra que a coluna nova fique
-- disponível imediatamente via API REST.
notify pgrst, 'reload schema';
