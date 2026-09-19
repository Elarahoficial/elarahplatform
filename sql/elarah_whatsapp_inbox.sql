-- =============================================================
-- ELARAH — Caixa de entrada do WhatsApp oficial (fase 1: guardar)
-- -------------------------------------------------------------
-- O PROBLEMA QUE ISSO RESOLVE
--   Quando o número migrou pra Cloud API, ele saiu do app do WhatsApp.
--   Numa conta Cloud API, mensagem que CHEGA é entregue só num webhook —
--   não existe caixa de entrada nativa. Sem webhook configurado, a Meta
--   simplesmente descarta: a resposta da cliente não fica guardada nem
--   na Meta nem aqui. Some.
--
--   Esta é a fase 1: parar de perder. A função whatsapp-webhook grava
--   tudo aqui. A tela de conversas vem depois — com os dados já salvos,
--   ela é só leitura.
--
-- DUAS TABELAS, DUAS COISAS DIFERENTES
--   whatsapp_mensagens      o que CHEGA (resposta da cliente, da parceira)
--   whatsapp_status_envio   o que acontece com o que a gente MANDOU
--                           (enviada → entregue → lida, ou falhou)
--
--   A segunda responde a pergunta que já custou horas: "será que chegou?".
--   Ela casa com whatsapp_send_log.provider_id, que guarda o mesmo
--   wa_message_id devolvido pela Meta no envio.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- ---------- 1) MENSAGENS RECEBIDAS ----------
create table if not exists public.whatsapp_mensagens (
  id               uuid primary key default gen_random_uuid(),
  -- ID da Meta (wamid...). UNIQUE porque a Meta REENVIA o mesmo webhook
  -- quando não recebe 200 rápido — sem isso, a conversa duplicaria.
  wa_message_id    text not null unique,
  -- Só dígitos, formato internacional (5511999990000), pra casar com
  -- bookings.telefone e fornecedores_metadata.whatsapp.
  telefone         text not null,
  -- Nome do perfil do WhatsApp de quem escreveu (vem no webhook).
  nome_perfil      text,
  -- text | image | audio | video | document | sticker | location | button |
  -- interactive | reaction | unsupported
  tipo             text not null default 'text',
  -- Corpo de texto. Em mídia, vem a legenda (quando tem).
  texto            text,
  -- Mídia fica NA META por um tempo; aqui guardamos o id pra baixar
  -- depois com o token (a fase 2 resolve o download).
  media_id         text,
  media_mime       text,
  -- Quando é resposta a uma mensagem nossa, o wamid dela.
  responde_a       text,
  -- Horário que a Meta carimbou (não o que a gente recebeu).
  wa_timestamp     timestamptz,
  recebida_em      timestamptz not null default now(),
  -- Marcada como lida NO PAINEL (não é o "lida" do WhatsApp).
  lida_em          timestamptz,
  -- Payload cru do evento. Guardar barato hoje evita perder um campo
  -- que a gente só vai descobrir que precisava daqui a seis meses.
  raw              jsonb
);

create index if not exists whatsapp_mensagens_telefone_idx
  on public.whatsapp_mensagens (telefone, wa_timestamp desc);

create index if not exists whatsapp_mensagens_recentes_idx
  on public.whatsapp_mensagens (wa_timestamp desc);

-- Não lidas primeiro: é o que a tela de conversas vai pedir o tempo todo.
create index if not exists whatsapp_mensagens_nao_lidas_idx
  on public.whatsapp_mensagens (recebida_em desc) where lida_em is null;

comment on table public.whatsapp_mensagens is
  'Mensagens RECEBIDAS no WhatsApp oficial (Cloud API), gravadas pela Edge Function whatsapp-webhook. Sem isso a Meta descarta.';

-- ---------- 2) STATUS DO QUE A GENTE MANDOU ----------
create table if not exists public.whatsapp_status_envio (
  id               uuid primary key default gen_random_uuid(),
  -- Casa com whatsapp_send_log.provider_id.
  wa_message_id    text not null,
  -- sent | delivered | read | failed
  status           text not null,
  telefone         text,
  wa_timestamp     timestamptz,
  recebido_em      timestamptz not null default now(),
  -- Código e texto do erro quando status = failed. É aqui que aparece
  -- "template não existe", "fora da janela de 24h", "token expirado".
  erro_codigo      text,
  erro_titulo      text,
  raw              jsonb,
  -- O mesmo status chega repetido; o par (mensagem, status) é único.
  unique (wa_message_id, status)
);

create index if not exists whatsapp_status_envio_msg_idx
  on public.whatsapp_status_envio (wa_message_id);

create index if not exists whatsapp_status_envio_falhas_idx
  on public.whatsapp_status_envio (recebido_em desc) where status = 'failed';

comment on table public.whatsapp_status_envio is
  'Status de entrega das mensagens que a Elarah mandou (sent/delivered/read/failed). Casa com whatsapp_send_log.provider_id.';

-- ---------- RLS ----------
-- Admin lê; a Edge Function (service_role) ignora RLS e faz os inserts.
-- Ninguém mais enxerga — são conversas de clientes.
alter table public.whatsapp_mensagens enable row level security;
drop policy if exists whatsapp_mensagens_admin_read on public.whatsapp_mensagens;
create policy whatsapp_mensagens_admin_read on public.whatsapp_mensagens
  for select using (public.is_admin());

alter table public.whatsapp_status_envio enable row level security;
drop policy if exists whatsapp_status_envio_admin_read on public.whatsapp_status_envio;
create policy whatsapp_status_envio_admin_read on public.whatsapp_status_envio
  for select using (public.is_admin());

notify pgrst, 'reload schema';

-- =============================================================
-- VERIFICAÇÃO
--   -- Chegou alguma coisa?
--   select wa_timestamp, telefone, nome_perfil, tipo, texto
--     from whatsapp_mensagens
--    order by wa_timestamp desc
--    limit 30;
--
--   -- O que a gente mandou está sendo entregue?
--   select status, count(*)
--     from whatsapp_status_envio
--    where recebido_em > now() - interval '7 days'
--    group by status;
--
--   -- Por que falhou:
--   select recebido_em, telefone, erro_codigo, erro_titulo
--     from whatsapp_status_envio
--    where status = 'failed'
--    order by recebido_em desc
--    limit 20;
--
--   -- Quem escreveu e ainda não foi lida no painel:
--   select telefone, nome_perfil, count(*) as mensagens,
--          max(wa_timestamp) as ultima
--     from whatsapp_mensagens
--    where lida_em is null
--    group by telefone, nome_perfil
--    order by ultima desc;
-- =============================================================
