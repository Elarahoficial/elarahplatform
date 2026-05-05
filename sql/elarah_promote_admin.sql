-- =============================================================
-- ELARAH — Promover conta a admin (com diagnóstico)
-- -------------------------------------------------------------
-- Use este arquivo quando o login do admin não estiver funcionando.
-- Rode no SQL Editor do Supabase.
-- =============================================================

-- ===== PASSO 1: Diagnóstico =====
-- Mostra o estado atual de todos os users + profiles, ordenado
-- pelos mais recentes primeiro. Use pra confirmar:
--   - Seu email aparece em auth.users?
--   - Tem linha em public.profiles com mesmo id?
--   - Coluna 'role' está 'admin'?
select
  u.id,
  u.email                                  as auth_email,
  u.email_confirmed_at is not null         as email_confirmado,
  p.id is not null                         as tem_profile,
  p.role,
  p.email                                  as profile_email,
  p.nome,
  u.created_at                             as auth_created,
  p.created_at                             as profile_created
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;

-- ===== PASSO 2: Backfill — cria profile se não existir =====
-- Idempotente. Se o profile já existe, não faz nada (o ON CONFLICT
-- abaixo só atualiza role e email — não sobrescreve nome/telefone).
insert into public.profiles (id, email, nome, telefone, cidade, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'nome', ''),
  coalesce(u.raw_user_meta_data->>'telefone', ''),
  coalesce(u.raw_user_meta_data->>'cidade', ''),
  'user'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ===== PASSO 3: PROMOVER — TROQUE O EMAIL ABAIXO =====
-- Substitua 'SEU_EMAIL_AQUI@gmail.com' pelo email que você usa
-- pra logar no Elarah, e rode SÓ ESTE BLOCO.
-- (case-insensitive: lower() em ambos os lados pra evitar
-- problemas com letras maiúsculas/minúsculas no cadastro)

update public.profiles
   set role = 'admin'
 where lower(email) = lower('SEU_EMAIL_AQUI@gmail.com');

-- ===== PASSO 4: Confirmar que virou admin =====
-- Deve retornar 1 linha com role='admin' e seu email.
select id, email, role, nome
  from public.profiles
 where lower(email) = lower('SEU_EMAIL_AQUI@gmail.com');

-- ===== PASSO 5 (opcional): listar TODOS os admins =====
-- select email, nome, role, created_at
--   from public.profiles
--  where role = 'admin'
--  order by created_at desc;
