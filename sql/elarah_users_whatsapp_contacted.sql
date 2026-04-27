-- =============================================================
-- ELARAH — Marcar usuários já contatados no WhatsApp
-- -------------------------------------------------------------
-- Adiciona coluna profiles.whatsapp_contacted_at — usada pra
-- saber se já foi convidado pro grupo de WhatsApp. No painel
-- admin, o botão verde fica permanente após o primeiro click;
-- usuários ainda não contatados ficam laranja.
--
-- Backfill: marca TODOS os existentes como contatados (now()),
-- porque o admin já passou por todos antes deste deploy. Daqui
-- pra frente, novos cadastros vêm com a coluna NULL e aparecem
-- em laranja até o admin clicar.
--
-- Idempotente. Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

alter table public.profiles
  add column if not exists whatsapp_contacted_at timestamptz;

-- Marca como contatado tudo que ainda está NULL.
update public.profiles
   set whatsapp_contacted_at = now()
 where whatsapp_contacted_at is null;

-- Diagnóstico (opcional):
-- select count(*) filter (where whatsapp_contacted_at is not null) as contatados,
--        count(*) filter (where whatsapp_contacted_at is null)     as nao_contatados
--   from public.profiles;
