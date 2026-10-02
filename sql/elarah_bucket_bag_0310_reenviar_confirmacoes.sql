-- =============================================================
-- ELARAH — "Crie sua Própria Bolsa - Bucket Bag" 03/10: reenvia o
-- e-mail de confirmação (com o endereço novo) para todas de uma vez
-- -------------------------------------------------------------
-- Faz o mesmo que clicar "📧 Reenviar confirmação" em cada reserva:
-- chama a edge function resend-booking-confirmation via pg_net, usando
-- a service role key guardada no Vault (elarah_service_role_key — a
-- mesma dos crons de social/analytics).
--
-- Só manda para reservas que JÁ estão com o endereço da Faria Lima
-- (ou seja, depois do PASSO 2 de elarah_bucket_bag_0310_novo_endereco.sql).
--
-- Rode um bloco por vez no Supabase → SQL Editor.
-- =============================================================

-- BLOCO A — conferência (não envia nada). Tem que listar as clientes
-- com endereco = Av. Brig. Faria Lima, 4440 e chave_ok = true.
select b.nome, b.email, b.metadata->>'endereco' as endereco,
       b.metadata->>'bairro' as bairro,
       exists (select 1 from vault.decrypted_secrets
                where name = 'elarah_service_role_key') as chave_ok
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where e.nome ilike '%bucket bag%'
   and b.data ~ '(2026-10-03|03/10)'
   and b.status = 'pago'
 order by b.nome;

-- BLOCO B — ENVIA os e-mails (rode UMA vez só; rodar de novo manda
-- de novo). Devolve um request_id por cliente.
select b.nome, b.email,
       net.http_post(
         url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/resend-booking-confirmation',
         headers := jsonb_build_object(
           'Content-Type',  'application/json',
           'Authorization', 'Bearer ' || (
             select decrypted_secret
               from vault.decrypted_secrets
              where name = 'elarah_service_role_key'
              limit 1
           )
         ),
         body    := jsonb_build_object('booking_id', b.id),
         timeout_milliseconds := 30000
       ) as request_id
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where e.nome ilike '%bucket bag%'
   and b.data ~ '(2026-10-03|03/10)'
   and b.status = 'pago'
   and b.metadata->>'endereco' ilike '%faria lima%'
   and coalesce(b.email, '') <> '';

-- BLOCO C — resultado (rode uns 10 segundos depois do B). Cada linha
-- deve ter status_code 200 e "ok":true na resposta.
select r.id as request_id, r.status_code, r.content, r.error_msg, r.created
  from net._http_response r
 where r.created > now() - interval '15 minutes'
 order by r.id desc
 limit 20;
