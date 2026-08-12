-- =============================================================
-- ELARAH — Corrigir e-mail digitado errado no cadastro
-- -------------------------------------------------------------
-- Um usuário se cadastrou com o e-mail terminado em ".con"
-- (faltou o "m"), então o e-mail de confirmação do cadastro
-- nunca chegou. Este script troca o endereço errado pelo certo
-- pra que a confirmação possa ser reenviada.
--
--   ERRADO:  callegaricarol@outlook.con
--   CERTO:   callegaricarol@outlook.com
--
-- O e-mail do usuário fica guardado em 3 lugares e todos são
-- atualizados aqui, dentro de UMA transação (ou muda tudo, ou
-- não muda nada):
--   1) auth.users.email          → login / confirmação
--   2) auth.identities           → identidade do provider "email"
--                                  (o campo email é GERADO a partir
--                                   do identity_data, por isso só
--                                   mexemos no JSON — nunca na coluna)
--   3) public.profiles.email     → espelho usado no painel admin
--
-- Idempotente: se rodar de novo depois de corrigido, não acha
-- mais o ".con" e não faz nada.
--
-- Como usar: cole no SQL Editor do Supabase e rode UMA vez.
-- Depois, reenvie a confirmação (veja o bloco no fim do arquivo).
-- =============================================================

-- Parâmetros (ajuste aqui se precisar reaproveitar pra outro caso)
--   de:  callegaricarol@outlook.con
--   pra: callegaricarol@outlook.com

-- ---------- 1) Diagnóstico ANTES ----------
-- Confirme que existe exatamente 1 usuário com o e-mail errado.
select u.id,
       u.email                         as email_atual,
       u.email_confirmed_at,
       p.email                         as profile_email,
       i.identity_data ->> 'email'     as identity_email
  from auth.users u
  left join public.profiles p   on p.id = u.id
  left join auth.identities i   on i.user_id = u.id and i.provider = 'email'
 where lower(u.email) = 'callegaricarol@outlook.con';

-- ---------- 2) Correção (transação) ----------
begin;

-- 2a) auth.users — endereço de login/confirmação
update auth.users
   set email      = 'callegaricarol@outlook.com',
       updated_at = now()
 where lower(email) = 'callegaricarol@outlook.con';

-- 2b) auth.identities — provider "email".
--     A coluna auth.identities.email é GERADA a partir de
--     identity_data->>'email', então atualizamos só o JSON.
update auth.identities
   set identity_data = jsonb_set(identity_data, '{email}', '"callegaricarol@outlook.com"'::jsonb),
       updated_at    = now()
 where provider = 'email'
   and lower(identity_data ->> 'email') = 'callegaricarol@outlook.con';

-- 2c) public.profiles — espelho mostrado no painel admin
update public.profiles
   set email = 'callegaricarol@outlook.com'
 where lower(email) = 'callegaricarol@outlook.con';

-- 2d) public.bookings — a COMPRA guarda o e-mail digitado no checkout
--     numa coluna própria. É por isso que a compra não aparece quando
--     você busca por @outlook.com na aba Compras: ela ficou com o
--     ".con". Corrigimos pelo user_id (mais confiável) e, como rede de
--     segurança, também por qualquer booking com o e-mail errado.
update public.bookings
   set email = 'callegaricarol@outlook.com'
 where user_id = '0fcada61-f047-4ee7-bef9-88fd3be95fc8'
    or lower(email) = 'callegaricarol@outlook.con';

commit;

-- ---------- 3) Diagnóstico DEPOIS ----------
-- Os três e-mails devem aparecer agora como ...@outlook.com
select u.id,
       u.email                         as email_atual,
       u.email_confirmed_at,
       p.email                         as profile_email,
       i.identity_data ->> 'email'     as identity_email
  from auth.users u
  left join public.profiles p   on p.id = u.id
  left join auth.identities i   on i.user_id = u.id and i.provider = 'email'
 where lower(u.email) = 'callegaricarol@outlook.com';

-- Confere as compras dessa pessoa (agora devem sair com @outlook.com).
-- Se aqui aparecer alguma linha, ela vai aparecer na aba Compras.
select id, created_at, experiencia_nome, status, email
  from public.bookings
 where user_id = '0fcada61-f047-4ee7-bef9-88fd3be95fc8'
    or lower(email) = 'callegaricarol@outlook.com'
 order by created_at desc;

-- =============================================================
-- 4) REENVIAR A CONFIRMAÇÃO (depois de rodar o de cima)
-- -------------------------------------------------------------
-- Opção A — Painel do Supabase (mais simples):
--   Authentication → Users → busque callegaricarol@outlook.com
--   → botão de reenviar/"Send confirmation".
--
-- Opção B — Pelo site (código), com a Supabase JS já carregada:
--   await supabase.auth.resend({
--     type: 'signup',
--     email: 'callegaricarol@outlook.com'
--   })
-- =============================================================
