-- =========================================================
-- ELARAH — FIX LOGIN: profiles_insert_own + backfill
--
-- Sintoma corrigido: usuário consegue digitar email/senha,
-- a request de auth volta 200 OK, mas a UI não atualiza pra
-- "logado". Causa: o profile na tabela public.profiles não
-- existe pra essa conta (criada antes do trigger ou trigger
-- falhou silenciosamente). O JS retorna currentProfile=null
-- e isLoggedIn() vira false.
--
-- Esta migration:
-- 1) Cria policy permitindo o user inserir o próprio profile
--    (auth.uid() = id), pra que o ensureProfile do auth.js
--    consiga upsert quando precisar.
-- 2) Faz backfill: cria um profile pra todo auth.user que
--    não tem um. Idempotente.
--
-- Rode UMA vez no SQL Editor do Supabase. Pode rodar de novo
-- sem quebrar nada.
-- =========================================================

-- ---------- Policy: user pode inserir o próprio profile ----------
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ---------- Backfill: cria profile pra todo auth.user sem ----------
insert into public.profiles (id, email, nome, telefone, cidade)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'nome', ''),
  coalesce(u.raw_user_meta_data->>'telefone', ''),
  coalesce(u.raw_user_meta_data->>'cidade', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ---------- Diagnóstico: quantos profiles existem agora ----------
-- Se quiser conferir no SQL Editor, descomente:
-- select count(*) as total_profiles from public.profiles;
-- select count(*) as total_auth_users from auth.users;
-- (devem ser iguais)

-- ---------- LEMBRETE: promover admin ----------
-- Depois do backfill, se a conta admin estava sem profile,
-- promove ela:
--
--   update public.profiles
--      set role = 'admin'
--    where email = 'contato.elarah@gmail.com';
