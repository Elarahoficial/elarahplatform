-- =========================================================
-- ELARAH PLATFORM — experiences visibility
-- -----------------------------------------------------
-- Adiciona a coluna is_active para permitir que o admin
-- oculte/mostre experiências sem precisar excluí-las.
--
-- Idempotente: pode rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase DEPOIS de
-- elarah_supabase_setup.sql.
-- =========================================================

alter table public.experiences
  add column if not exists is_active boolean not null default true;

-- Garante que registros pré-existentes fiquem visíveis por padrão.
-- (O default da coluna já cobre linhas novas; este update é só pra
-- qualquer linha que porventura esteja com NULL em uma versão
-- anterior da coluna.)
update public.experiences
   set is_active = true
 where is_active is null;

create index if not exists experiences_is_active_idx
  on public.experiences (is_active);

-- =========================================================
-- Pronto. O frontend filtra is_active=true, o admin enxerga
-- tudo e tem botão pra alternar.
-- =========================================================
