-- =============================================================
-- ELARAH — Pacote/Passaporte: lista de datas do pacote
-- -------------------------------------------------------------
-- Adiciona coluna pacote_datas (jsonb array) na tabela experiences.
-- Usado pra registrar experiencias do tipo "Passaporte" que sao
-- pacotes com MULTIPLAS datas (ex: "Collage Club & Artsy Club" =
-- 2 encontros em datas diferentes, cliente vai a ambos).
--
-- Quando preenchido, o frontend mostra "Esse pacote inclui N
-- encontros: data1, data2..." na pagina da experiencia.
--
-- NULL ou array vazio = experiencia normal (uma data soh, vinda
-- de experiences.data ou dos slots).
--
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente.
-- =============================================================

alter table public.experiences
  add column if not exists pacote_datas jsonb;

comment on column public.experiences.pacote_datas is
  'Array de datas (strings tipo "12/06") que compoem um pacote/passaporte. Quando preenchido com 2+ datas, indica que a experiencia eh um pacote multi-encontro e o cliente participa de TODAS as datas listadas. NULL = experiencia normal de uma data soh.';
