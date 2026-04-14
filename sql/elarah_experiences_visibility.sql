-- =========================================================
-- ELARAH PLATFORM — experiences visibility
-- -----------------------------------------------------
-- Adiciona a coluna is_active para permitir que o admin
-- oculte/mostre experiências sem precisar excluí-las.
--
-- Idempotente: pode rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase DEPOIS de
-- elarah_supabase_setup.sql.
-- ELARAH PLATFORM — experiences hide/unhide
-- -----------------------------------------------------
-- Adiciona is_active (default true) na tabela experiences
-- pra permitir ocultar experiências sem deletar os dados.
--
-- Idempotente: pode rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =========================================================

alter table public.experiences
  add column if not exists is_active boolean not null default true;

-- Garante que registros pré-existentes fiquem visíveis por padrão.
update public.experiences
   set is_active = true
 where is_active is null;
-- Garante que linhas antigas continuem visíveis (default vale só pra
-- novas linhas, mas como acabamos de criar a coluna, todas as linhas
-- existentes ganham true automaticamente porque é NOT NULL DEFAULT).
update public.experiences
   set is_active = true
 where is_active is null;

create index if not exists experiences_is_active_idx
  on public.experiences (is_active);

-- =========================================================
-- Pronto. O frontend filtra is_active=true, o admin enxerga
-- tudo e tem botão pra alternar.
-- =========================================================
