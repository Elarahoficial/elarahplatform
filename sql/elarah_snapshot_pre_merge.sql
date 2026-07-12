-- =============================================================
-- ELARAH — Backup (snapshot) ANTES do merge de duplicadas
-- -------------------------------------------------------------
-- Backup grátis, feito por SQL, pra quem está no plano Free do
-- Supabase (que não tem backup automático). Copia as tabelas que
-- o merge encosta pra um schema separado `backup_premerge`, dentro
-- do próprio banco. Se precisar reverter, os dados originais estão lá.
--
-- Rode ANTES de:
--   sql/elarah_merge_duplicate_experiences.sql
--
-- SEGURO
--   • Só COPIA (create table as). Não altera nem apaga nada do site.
--   • Se você rodar de novo, mantém o primeiro snapshot (não
--     sobrescreve) — pra não perder o estado original.
--   • Ignora tabela que não existir no seu banco.
--
-- Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

do $$
declare
  t     text;
  n     bigint;
  tabelas text[] := array[
    'experiences', 'experience_slots', 'bookings', 'reviews',
    'coupons', 'manual_sales', 'financial_expenses',
    'experience_suppliers', 'experience_recurrence_rules'
  ];
begin
  create schema if not exists backup_premerge;

  foreach t in array tabelas loop
    if to_regclass('public.' || t) is null then
      raise notice 'pulado (não existe): public.%', t;
    elsif to_regclass('backup_premerge.' || t) is not null then
      raise notice 'já existe backup de %, mantido intacto', t;
    else
      execute format('create table backup_premerge.%I as table public.%I', t, t);
      execute format('select count(*) from backup_premerge.%I', t) into n;
      raise notice 'backup de % criado (% linhas)', t, n;
    end if;
  end loop;
end $$;

-- CONFERIR o que foi salvo:
--   select table_name from information_schema.tables
--    where table_schema = 'backup_premerge' order by table_name;
--
-- RESTAURAR uma tabela inteira (só em emergência — cuidado):
--   -- ex: devolver experiences ao estado pré-merge
--   -- begin;
--   --   delete from public.experiences;   -- respeite FKs / ordem
--   --   insert into public.experiences select * from backup_premerge.experiences;
--   -- commit;
--   (Me chame que eu monto o restore certo pro seu caso.)
--
-- APAGAR os backups quando tiver certeza que deu tudo certo:
--   drop schema backup_premerge cascade;
-- =============================================================
