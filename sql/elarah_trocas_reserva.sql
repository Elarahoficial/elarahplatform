-- =============================================================
-- ELARAH — Trocas e reembolsos feitos pela própria cliente
-- -------------------------------------------------------------
-- Antes: pra trocar a data (ou a experiência) a cliente chamava a
-- Elarah no WhatsApp e alguém da equipe editava a reserva no painel.
-- Muita mensagem só pra isso.
--
-- Agora: em "Minhas compras" (conta.html) a cliente troca sozinha,
-- dentro do prazo de remarcação sem custo da categoria (bartenderia 5
-- dias, gastronomia 72h, demais 48h — congelado na compra em
-- bookings.metadata.politica_remarcacao_horas). A Edge Function
-- cliente-trocar-reserva valida tudo, move a vaga e grava UMA LINHA
-- AQUI. A aba "Trocas e reembolsos" do painel lê esta tabela e monta o
-- aviso de WhatsApp pra parceira (ou pras duas, quando a troca é pra
-- experiência de outra parceira).
--
-- Reembolso continua sendo com a Elarah: o botão "Pedir reembolso"
-- abre o WhatsApp e também registra aqui (tipo = 'reembolso'), pra o
-- pedido aparecer na mesma aba e não se perder na conversa.
--
-- Escrita só pela Edge Function (service role). Admin lê e marca os
-- avisos/resolução pelo painel. A cliente lê as próprias linhas.
--
-- Idempotente. Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

create table if not exists public.trocas_reserva (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  tipo                  text not null default 'troca'
                          check (tipo in ('troca', 'reembolso')),
  -- mesma_experiencia | mesmo_parceiro | outro_parceiro (só em 'troca')
  modalidade            text,
  booking_id            uuid references public.bookings(id) on delete set null,
  user_id               uuid references auth.users(id) on delete set null,

  cliente_nome          text,
  cliente_email         text,
  cliente_telefone      text,
  quantidade            integer not null default 1,

  -- Como estava
  de_experiencia_id     uuid,
  de_experiencia_nome   text,
  de_data               text,
  de_horario            text,
  de_fornecedor_nome    text,
  de_endereco           text,

  -- Como ficou (vazio em 'reembolso')
  para_experiencia_id   uuid,
  para_experiencia_nome text,
  para_data             text,
  para_horario          text,
  para_fornecedor_nome  text,
  para_endereco         text,

  motivo                text,
  -- Avisos pras parceiras (clique no botão de WhatsApp da aba).
  -- Mesma parceira → só aviso_para_at é usado.
  aviso_de_at           timestamptz,
  aviso_para_at         timestamptz,
  -- Admin marca quando terminou de tratar (reembolso feito, etc.)
  resolvido_at          timestamptz,
  observacao            text
);

create index if not exists trocas_reserva_created_idx
  on public.trocas_reserva (created_at desc);
create index if not exists trocas_reserva_booking_idx
  on public.trocas_reserva (booking_id);

alter table public.trocas_reserva enable row level security;

drop policy if exists "trocas_reserva_admin_all" on public.trocas_reserva;
create policy "trocas_reserva_admin_all"
  on public.trocas_reserva
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "trocas_reserva_owner_select" on public.trocas_reserva;
create policy "trocas_reserva_owner_select"
  on public.trocas_reserva
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Sem policy de INSERT pra cliente: quem grava é a Edge Function
-- (service role), depois de validar prazo, vaga e dono da reserva.

-- Diagnóstico (opcional):
-- select created_at, tipo, modalidade, cliente_nome,
--        de_experiencia_nome, de_data, para_experiencia_nome, para_data
--   from public.trocas_reserva order by created_at desc limit 50;
