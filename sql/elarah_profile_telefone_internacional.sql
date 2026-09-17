-- =============================================================
-- ELARAH — Telefone internacional no cadastro (profiles)
-- -------------------------------------------------------------
-- public.profiles.telefone é text livre: aceita qualquer formato,
-- inclusive número estrangeiro. Quem assume "Brasil" é o painel,
-- na hora de montar o link do WhatsApp — e é por isso que o
-- número precisa ser salvo COM o DDI escrito ("+39 …"). Com o
-- "+" na frente, o admin usa os dígitos como estão; sem ele,
-- prefixa 55 e abre conversa com o número errado.
--
-- Caso desta rodada: brenda.ladeia@gmail.com mora fora do Brasil
-- e o telefone dela é italiano (DDI +39).
--
-- Idempotente: pode rodar mais de uma vez. Rode no SQL Editor do
-- Supabase.
-- =============================================================

-- 1) Confere quem vai ser alterado ANTES de gravar.
select id, email, nome, telefone
  from public.profiles
 where lower(email) = lower('brenda.ladeia@gmail.com');

-- 2) Grava o telefone com DDI explícito.
update public.profiles
   set telefone   = '+39 351 743 4071',
       updated_at = now()
 where lower(email) = lower('brenda.ladeia@gmail.com')
   and coalesce(telefone, '') is distinct from '+39 351 743 4071';

-- 3) Confere o resultado.
select id, email, nome, telefone, updated_at
  from public.profiles
 where lower(email) = lower('brenda.ladeia@gmail.com');

-- =============================================================
-- Se o passo 1 não devolver nenhuma linha, o cadastro dela não
-- existe em public.profiles (conta nunca criada, ou criada antes
-- do trigger handle_new_user). Nesse caso, confira em auth.users:
--
--   select id, email, created_at from auth.users
--    where lower(email) = lower('brenda.ladeia@gmail.com');
--
-- Existindo em auth.users mas não em profiles, o insert abaixo
-- cria o cadastro (o id PRECISA ser o mesmo de auth.users):
--
--   insert into public.profiles (id, email, nome, telefone)
--   select u.id, u.email,
--          coalesce(u.raw_user_meta_data->>'nome', ''),
--          '+39 351 743 4071'
--     from auth.users u
--    where lower(u.email) = lower('brenda.ladeia@gmail.com')
--   on conflict (id) do update
--      set telefone = excluded.telefone,
--          updated_at = now();
-- =============================================================

-- -------------------------------------------------------------
-- Diagnóstico geral: quem mais está com telefone estrangeiro
-- salvo SEM o "+" (esses abrem WhatsApp errado no painel).
-- Heurística: 12+ dígitos que não começam com 55.
-- -------------------------------------------------------------
-- select id, email, nome, telefone
--   from public.profiles
--  where telefone is not null
--    and telefone not like '+%'
--    and length(regexp_replace(telefone, '\D', '', 'g')) >= 12
--    and left(regexp_replace(telefone, '\D', '', 'g'), 2) <> '55';

-- -------------------------------------------------------------
-- Diagnóstico 2: telefone salvo com "+" mas com 11 dígitos ou
-- menos. O painel passou a confiar no "+" como DDI, então esses
-- casos (um "+" digitado por engano num número BR) geram link
-- sem o 55. Se aparecer alguma linha aqui, tire o "+" dela.
-- -------------------------------------------------------------
-- select id, email, nome, telefone
--   from public.profiles
--  where telefone like '+%'
--    and length(regexp_replace(telefone, '\D', '', 'g')) <= 11;
