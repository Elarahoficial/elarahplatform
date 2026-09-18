-- =============================================================
-- ELARAH — Diagnóstico: desde quando o WhatsApp parou de sair
-- -------------------------------------------------------------
-- Use quando a whatsapp_send_log estiver cheia de status='failed'.
-- As duas primeiras queries são SÓ LEITURA. A terceira (recuperação)
-- está comentada de propósito — leia antes de rodar.
-- =============================================================

-- ===== 1. QUANDO QUEBROU: último envio OK x primeira falha depois dele
select
  (select max(created_at) from public.whatsapp_send_log where status = 'sent')   as ultimo_envio_ok,
  (select count(*)        from public.whatsapp_send_log where status = 'sent')   as total_ok,
  (select count(*)        from public.whatsapp_send_log where status = 'failed') as total_falhas,
  (select min(created_at) from public.whatsapp_send_log
     where status = 'failed'
       and created_at > coalesce(
             (select max(created_at) from public.whatsapp_send_log where status = 'sent'),
             '1970-01-01'::timestamptz))                                          as primeira_falha_da_sequencia;

-- ===== 2. QUEM FICOU SEM MENSAGEM (agrupado por erro e por dia)
select
  date_trunc('day', created_at)::date as dia,
  kind                                as tipo,
  coalesce(error, '(sem erro)')       as erro,
  count(*)                            as quantas
from public.whatsapp_send_log
where status = 'failed'
group by 1, 2, 3
order by dia desc, quantas desc;

-- =============================================================
-- ===== 3. RECUPERAÇÃO — LEIA ANTES DE RODAR =====
--
-- POR QUE PRECISA DISSO: a trava anti-duplicidade reserva a chave ANTES
-- de tentar enviar. Quando o envio falha, a linha continua lá com
-- status='failed' — e a chave segue ocupada. Ou seja: mesmo depois de
-- consertar a causa, essas pessoas NÃO recebem a mensagem numa nova
-- tentativa (o portão vê "duplicate" e não envia).
--
-- Apagar as linhas que FALHARAM libera a chave e permite a mensagem
-- sair quando o fluxo rodar de novo. Não apaga nada que foi enviado:
-- o filtro é status='failed'.
--
-- ANTES: conserte a causa (ex.: ZAPI_CLIENT_TOKEN certo nos secrets,
-- ou a migração pra API oficial). Liberar a chave com a causa ainda
-- quebrada só gera falha de novo.
--
-- CUIDADO COM A JANELA: libere só o período que você quer reenviar.
-- Confirmação de uma compra de 3 semanas atrás chegando hoje confunde
-- a cliente. Ajuste o intervalo.
--
-- select count(*) from public.whatsapp_send_log
--  where status = 'failed'
--    and created_at > now() - interval '3 days';
--
-- delete from public.whatsapp_send_log
--  where status = 'failed'
--    and created_at > now() - interval '3 days';
-- =============================================================
