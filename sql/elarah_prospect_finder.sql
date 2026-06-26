-- =========================================================
-- ELARAH — Agente caça-parceiros (Google Places)
-- =========================================================
-- Prepara a tabela public.prospects pra receber leads automáticos
-- toda semana SEM repetir. Guarda o id do Google (place_id) pra
-- dedupe à prova de bala (mesmo nome escrito diferente).
--
-- Rode UMA vez no SQL Editor. Idempotente.
-- Pré-requisito: sql/elarah_crm_prospects.sql (tabela prospects).
-- =========================================================

-- id único do Google Maps por lugar — chave de dedupe entre semanas.
alter table public.prospects
  add column if not exists google_place_id text;

-- de onde veio o lead (google_places, manual, osm, etc.)
alter table public.prospects
  add column if not exists origem text;

-- Não deixa entrar o mesmo lugar 2x. Índice único NÃO-parcial (Postgres
-- trata NULL como distinto, então vários prospects manuais sem place_id
-- continuam permitidos). Precisa ser não-parcial pro upsert ON CONFLICT
-- da Edge Function conseguir referenciá-lo.
create unique index if not exists prospects_google_place_id_uidx
  on public.prospects (google_place_id);

-- =========================================================
-- VERIFICAÇÃO
--   select origem, count(*) from public.prospects group by origem;
--   select nome, categoria, whatsapp, site, status, created_at
--     from public.prospects where origem = 'google_places'
--     order by created_at desc limit 30;
-- =========================================================
