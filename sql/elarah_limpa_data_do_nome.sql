-- =============================================================
-- ELARAH — Limpa a DATA embutida no NOME das experiências
-- -------------------------------------------------------------
-- Depois de juntar as duplicadas (merge), a experiência que ficou
-- pode ter a data no título — ex: "Aula de Cerâmica 12/04" —
-- porque as cópias tinham a data no nome. Como agora a data virou
-- opção dentro da experiência, o nome não precisa mais dela.
--
-- Este script tira do nome trechos de data no formato DD/MM ou
-- DD/MM/AAAA (com ou sem "dia", com ou sem parênteses), e limpa
-- traços/barras/espaços que sobrarem nas pontas.
--   "Aula de Cerâmica 12/04"        -> "Aula de Cerâmica"
--   "Vela Aromática - 05/05"        -> "Vela Aromática"
--   "Tufting (dia 26/04/2026)"      -> "Tufting"
--
-- SEGURO
--   • Só mexe nas experiências que foram MANTIDAS num merge
--     (as que estão em experiences_merge_log como principais) e
--     que continuam ativas. Não toca no resto do site.
--   • Guarda o nome antigo em public.experiences_name_cleanup_log
--     (backup — dá pra reverter).
--   • Só altera quando o nome realmente muda e sobra um nome válido
--     (nunca deixa nome vazio).
--   • Idempotente: rodar de novo não faz nada.
--
-- Rode DEPOIS do merge, UMA VEZ no SQL Editor do Supabase.
-- =============================================================

-- ---------- PRÉVIA (opcional): rode isto SEPARADO pra conferir ----------
-- Mostra nome atual -> nome novo, sem alterar nada:
--
-- select e.id, e.nome as nome_atual,
--        btrim(regexp_replace(
--          regexp_replace(e.nome,
--            '\s*[\(\[]?\s*(dia\s+)?[0-9]{1,2}/[0-9]{1,2}(/[0-9]{2,4})?\s*[\)\]]?',
--            ' ', 'gi'),
--          '\s+', ' ', 'g'),
--          E' \t\n\r-–—|:•·') as nome_novo
--   from public.experiences e
--  where e.id in (select distinct canonical_id from public.experiences_merge_log)
--    and coalesce(e.is_active, true) <> false;

-- ---------- APLICAR ----------
begin;

create table if not exists public.experiences_name_cleanup_log (
  id          bigserial primary key,
  cleaned_at  timestamptz not null default now(),
  experience_id uuid,
  nome_antigo text,
  nome_novo   text
);

with alvo as (
  select
    e.id,
    e.nome as nome_antigo,
    btrim(regexp_replace(
      regexp_replace(e.nome,
        '\s*[\(\[]?\s*(dia\s+)?[0-9]{1,2}/[0-9]{1,2}(/[0-9]{2,4})?\s*[\)\]]?',
        ' ', 'gi'),
      '\s+', ' ', 'g'),
      E' \t\n\r-–—|:•·') as nome_novo
  from public.experiences e
  where e.id in (select distinct canonical_id from public.experiences_merge_log)
    and coalesce(e.is_active, true) <> false
),
validos as (
  select * from alvo
   where nome_novo is not null
     and length(nome_novo) >= 2
     and nome_novo <> nome_antigo
),
log as (
  insert into public.experiences_name_cleanup_log (experience_id, nome_antigo, nome_novo)
  select id, nome_antigo, nome_novo from validos
  returning 1
)
update public.experiences e
   set nome = v.nome_novo
  from validos v
 where e.id = v.id;

commit;

-- Recarrega o cache do PostgREST.
notify pgrst, 'reload schema';

-- CONFERIR / DESFAZER (rode separado):
--   select * from public.experiences_name_cleanup_log order by cleaned_at desc;
--   -- reverter um nome:
--   -- update public.experiences set nome = '<nome_antigo>' where id = '<experience_id>';
