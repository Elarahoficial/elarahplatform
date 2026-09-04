-- =============================================================
-- ELARAH — Correção do telefone da Camila Ayumi Uehara
-- -------------------------------------------------------------
-- Camila Ayumi Uehara · ayumiuehara.c@gmail.com
--
--   ERRADO  : (11) 97727-7087
--   CORRETO : (11) 97727-7077   (final 77, não 87)
--
-- O número aparece em mais de um lugar (o cadastro dela, os
-- metadados do Auth e o snapshot salvo em cada reserva/venda),
-- então trocar só num lugar faz o número velho voltar depois.
-- Este script troca em TODOS de uma vez.
--
-- GUARDA DE SEGURANÇA: cada update só mexe na linha se ela ainda
-- estiver com o número ERRADO (comparando só os dígitos, então
-- não importa a máscara: "11977277087", "(11) 97727-7087" ou
-- "+55 11 97727-7087" são todos reconhecidos). Se você já
-- corrigiu na mão, o script não faz nada.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Rode no SQL Editor do Supabase com um usuário admin.
-- A ÚLTIMA consulta é a conferência: leia o resultado dela.
-- =============================================================

-- ---------- 1) Cadastro da cliente (profiles) ----------
-- É daqui que sai o número mostrado na lista de Usuários do
-- admin e o botão de WhatsApp.
update public.profiles
   set telefone = '(11) 97727-7077'
 where lower(email) = lower('ayumiuehara.c@gmail.com')
   and regexp_replace(coalesce(telefone, ''), '\D', '', 'g')
       in ('11977277087', '5511977277087');

-- ---------- 2) Metadados do Auth (auth.users) ----------
-- O telefone digitado no cadastro também fica aqui, e o auth.js
-- usa este valor pra recriar o profile quando ele some. Sem esta
-- troca, o número errado pode ressuscitar num próximo login.
update auth.users
   set raw_user_meta_data =
         jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb),
                   '{telefone}',
                   to_jsonb('(11) 97727-7077'::text),
                   true)
 where lower(email) = lower('ayumiuehara.c@gmail.com')
   and regexp_replace(coalesce(raw_user_meta_data->>'telefone', ''), '\D', '', 'g')
       in ('11977277087', '5511977277087');

-- ---------- 3) Reservas do site (bookings) ----------
-- Cada reserva guarda um snapshot do telefone no momento da
-- compra — é o número que o admin usa pra falar com ela sobre
-- aquela reserva específica.
update public.bookings
   set telefone = '(11) 97727-7077'
 where regexp_replace(coalesce(telefone, ''), '\D', '', 'g')
       in ('11977277087', '5511977277087');

-- ---------- 4) Acompanhantes de grupo (bookings.acompanhantes) ----------
-- Quando ela foi levada por outra pessoa, o telefone dela está
-- dentro do jsonb de acompanhantes (só dígitos, com DDD).
update public.bookings b
   set acompanhantes = (
         select jsonb_agg(
                  case
                    when regexp_replace(coalesce(a->>'telefone', ''), '\D', '', 'g')
                         in ('11977277087', '5511977277087')
                      then jsonb_set(a, '{telefone}', to_jsonb('11977277077'::text), true)
                    else a
                  end
                  order by ord
                )
           from jsonb_array_elements(b.acompanhantes) with ordinality as t(a, ord)
       )
 where exists (
         select 1
           from jsonb_array_elements(b.acompanhantes) as a
          where regexp_replace(coalesce(a->>'telefone', ''), '\D', '', 'g')
                in ('11977277087', '5511977277087')
       );

-- ---------- 5) Vendas manuais (manual_sales) ----------
-- Compras fechadas fora do site (WhatsApp, Pix direto etc.).
update public.manual_sales
   set customer_phone = '(11) 97727-7077'
 where regexp_replace(coalesce(customer_phone, ''), '\D', '', 'g')
       in ('11977277087', '5511977277087');

-- ---------- 6) Interesse no By Elarah (byelarah_submissions) ----------
update public.byelarah_submissions
   set telefone = '(11) 97727-7077'
 where regexp_replace(coalesce(telefone, ''), '\D', '', 'g')
       in ('11977277087', '5511977277087');

-- ---------- 7) Lista de espera de experiências (interesses) ----------
-- Esta tabela não guarda e-mail, então o casamento é pelo próprio
-- número — que é dela, então qualquer linha com ele é dela.
update public.interesses
   set whatsapp = '(11) 97727-7077'
 where regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g')
       in ('11977277087', '5511977277087');

-- =============================================================
-- CONFERÊNCIA — leia o resultado desta consulta.
--
--   ainda_errado = 0  em todas as linhas → deu certo.
--   ainda_errado > 0  → sobrou o número velho naquela tabela.
--   ja_certo          → quantas linhas estão com o número novo.
--
-- (Uma tabela com 0 e 0 só quer dizer que ela nunca teve o
-- número da Camila — é normal.)
-- =============================================================
select 'profiles'                 as tabela,
       count(*) filter (where regexp_replace(coalesce(telefone, ''), '\D', '', 'g') in ('11977277087', '5511977277087')) as ainda_errado,
       count(*) filter (where regexp_replace(coalesce(telefone, ''), '\D', '', 'g') = '11977277077')                      as ja_certo
  from public.profiles
union all
select 'auth.users (metadata)',
       count(*) filter (where regexp_replace(coalesce(raw_user_meta_data->>'telefone', ''), '\D', '', 'g') in ('11977277087', '5511977277087')),
       count(*) filter (where regexp_replace(coalesce(raw_user_meta_data->>'telefone', ''), '\D', '', 'g') = '11977277077')
  from auth.users
union all
select 'bookings',
       count(*) filter (where regexp_replace(coalesce(telefone, ''), '\D', '', 'g') in ('11977277087', '5511977277087')),
       count(*) filter (where regexp_replace(coalesce(telefone, ''), '\D', '', 'g') = '11977277077')
  from public.bookings
union all
-- Aqui a contagem é por acompanhante (não por reserva).
select 'bookings (acompanhantes)',
       count(*) filter (where tel in ('11977277087', '5511977277087')),
       count(*) filter (where tel = '11977277077')
  from (select regexp_replace(coalesce(a->>'telefone', ''), '\D', '', 'g') as tel
          from public.bookings b, jsonb_array_elements(b.acompanhantes) as a) ac
union all
select 'manual_sales',
       count(*) filter (where regexp_replace(coalesce(customer_phone, ''), '\D', '', 'g') in ('11977277087', '5511977277087')),
       count(*) filter (where regexp_replace(coalesce(customer_phone, ''), '\D', '', 'g') = '11977277077')
  from public.manual_sales
union all
select 'byelarah_submissions',
       count(*) filter (where regexp_replace(coalesce(telefone, ''), '\D', '', 'g') in ('11977277087', '5511977277087')),
       count(*) filter (where regexp_replace(coalesce(telefone, ''), '\D', '', 'g') = '11977277077')
  from public.byelarah_submissions
union all
select 'interesses',
       count(*) filter (where regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g') in ('11977277087', '5511977277087')),
       count(*) filter (where regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g') = '11977277077')
  from public.interesses
order by 1;
