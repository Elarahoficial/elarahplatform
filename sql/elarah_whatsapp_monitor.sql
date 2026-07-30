-- =========================================================
-- ELARAH — Monitor da whatsapp_send_log (auditoria de rollout)
-- -----------------------------------------------------
-- Rode estas queries no SQL Editor durante o rollout (Fases 1/2/3) e cole o
-- resultado pra análise. Cada uma detecta UMA classe de anomalia. Se
-- QUALQUER uma das queries de anomalia (marcadas 🚨) retornar linha, PARE:
-- desligue o envio (WHATSAPP_SENDING_ENABLED=false) e investigue.
-- =========================================================

-- ── A) 🚨 O DESASTRE que não pode repetir: mensagem enviada pra reserva que
--        está cancelada / reembolsada / aguardando experiência. DEVE vir VAZIO.
select l.kind, l.status, l.booking_id, l.phone_masked, b.status as booking_status,
       b.aguardando_experiencia, l.created_at
from public.whatsapp_send_log l
join public.bookings b on b.id = l.booking_id
where l.status = 'sent'
  and l.kind in ('confirmation','reminder48','feedback','pending')
  and (b.status in ('cancelado','reembolsado','expirado') or b.aguardando_experiencia = true)
order by l.created_at desc;

-- ── B) 🚨 Duplicidade real: mais de um envio 'sent' pro mesmo (booking, tipo).
--        O UNIQUE(dedupe_key) deve tornar isso IMPOSSÍVEL. DEVE vir VAZIO.
select dedupe_key, count(*) as envios
from public.whatsapp_send_log
where status = 'sent'
group by dedupe_key
having count(*) > 1;

-- ── C) 🚨 Destinatários distintos que receberam (compare com o ESPERADO da
--        fase). Na Fase 1 só deve aparecer o SEU número; na Fase 2, só os
--        números do grupo de teste (allowlist). Aparecer um número
--        desconhecido = anomalia.
select phone_masked, count(*) as envios, array_agg(distinct kind) as tipos,
       min(created_at) as primeiro, max(created_at) as ultimo
from public.whatsapp_send_log
where status = 'sent'
group by phone_masked
order by ultimo desc;

-- ── D) 🚨 Falhas de envio (Z-API rejeitou). Investigar o erro.
select kind, phone_masked, status, error, provider_id, created_at
from public.whatsapp_send_log
where status = 'failed'
order by created_at desc
limit 50;

-- ── E) 🚨 Reservas "presas": reservou a chave mas nunca finalizou (ficou
--        'pending' por > 10 min). Pode indicar crash entre reservar e enviar.
--        DEVE vir VAZIO (ou só linhas bem recentes de envios em andamento).
select dedupe_key, kind, phone_masked, status, created_at, updated_at
from public.whatsapp_send_log
where status = 'pending'
  and created_at < now() - interval '10 minutes'
order by created_at desc;

-- ── F) Panorama: volume por tipo e status nas últimas 24h (visão geral sadia).
select kind, status, count(*) as n
from public.whatsapp_send_log
where created_at > now() - interval '24 hours'
group by kind, status
order by kind, status;

-- ── G) MODO OBSERVAÇÃO: quem RECEBERIA se estivesse ligado (status 'observed').
--        Use durante o período de observação pra validar destinatários SEM enviar.
select kind, phone_masked, booking_id, created_at
from public.whatsapp_send_log
where status = 'observed'
order by created_at desc
limit 100;

-- ── H) Últimos 30 eventos (linha do tempo bruta pra colar na análise).
select kind, status, phone_masked, booking_id, error, created_at
from public.whatsapp_send_log
order by created_at desc
limit 30;
