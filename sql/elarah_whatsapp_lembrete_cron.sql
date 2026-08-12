-- =========================================================
-- ELARAH — Lembrete 2 dias antes por WhatsApp (cron diário)
-- =========================================================
-- Todo dia de manhã, procura reservas PAGAS cuja experiência acontece
-- daqui a 2 dias e ainda não receberam o lembrete, e chama a Edge
-- Function whatsapp-lembrete.
--
-- A data da experiência vem do slot (experience_slots.event_at), e a
-- comparação é feita no fuso de Brasília — então nunca erra o dia por
-- causa de fuso ou de "data" em texto livre. Reservas sem slot/sem
-- event_at são puladas (não dá pra saber a data com segurança).
--
-- Pré-requisitos:
--   * Edge Function whatsapp-lembrete deployada (verify_jwt = false).
--   * pg_cron + pg_net ligados.
--
-- ⚠️ Troque 'TROQUE_SEGREDO' pelo MESMO valor do seu ELARAH_WEBHOOK_SECRET.
--
-- Rode UMA vez no SQL Editor. Idempotente.
-- =========================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Marca de "já lembrado" (uma vez por reserva).
alter table public.bookings
  add column if not exists lembrete_2dias_sent_at timestamptz;

-- Seleção das reservas que vencem em 2 dias (conta no banco, fuso BR).
create or replace function public.elarah_due_lembrete()
returns table (
  id uuid,
  nome text,
  telefone text,
  experiencia_id uuid,
  experiencia_nome text,
  data text,
  horario text
)
language sql
stable
security definer
as $$
  select b.id, b.nome, b.telefone, b.experiencia_id,
         b.experiencia_nome, b.data, b.horario
  from public.bookings b
  join public.experience_slots s on s.id = b.slot_id
  where b.status = 'pago'
    and b.lembrete_2dias_sent_at is null
    and coalesce(nullif(trim(b.telefone), ''), '') <> ''
    and s.event_at is not null
    and (s.event_at at time zone 'America/Sao_Paulo')::date
        = ((now() at time zone 'America/Sao_Paulo')::date + 2)
  limit 500;
$$;

do $$
begin
  perform cron.unschedule('elarah-whatsapp-lembrete');
exception when others then null;
end $$;

-- 14h UTC = 11h BRT, todo dia.
select cron.schedule(
  'elarah-whatsapp-lembrete',
  '0 14 * * *',
  $$
    select net.http_post(
      url     := 'https://nwijxjmenbfyehvscogs.supabase.co/functions/v1/whatsapp-lembrete',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer TROQUE_SEGREDO'
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 150000
    );
  $$
);

-- =========================================================
-- VERIFICAÇÃO
--   select jobname, schedule, active from cron.job where jobname='elarah-whatsapp-lembrete';
--   -- Quem receberia AGORA (sem enviar):
--   select * from public.elarah_due_lembrete();
--   select count(*) filter (where lembrete_2dias_sent_at is not null) lembrados from public.bookings;
-- =========================================================
