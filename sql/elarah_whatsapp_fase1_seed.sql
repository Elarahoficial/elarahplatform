-- =========================================================
-- ELARAH — Seed de teste da FASE 1 do rollout de WhatsApp
-- -----------------------------------------------------
-- Cria reservas de teste COM O SEU NÚMERO em cada estado, com timestamps já
-- calculados pra caírem nas janelas do cron (automated-notifications):
--   * LEMBRETE  → evento daqui a ~42h  (janela 36–48h)
--   * FEEDBACK  → evento ~48h atrás     (janela 36–72h atrás)
--   * PENDENTE  → criado ~4h atrás      (janela 3–6h) status pending
--   * CANCELADO / REEMBOLSADO / AGUARDANDO → candidatos que DEVEM ser bloqueados
--
-- Fusos: as datas de evento são formatadas em America/Sao_Paulo, que é o
-- fuso (-03:00) que a função assume ao interpretar data+horário.
--
-- SEGURO na Fase 1: com WHATSAPP_ALLOWLIST_ONLY=true e o seu número na
-- WHATSAPP_TEST_ALLOWLIST, só o SEU número pode receber — nenhuma reserva real
-- de cliente é tocada, mesmo que a seleção estivesse errada.
--
-- >>> ANTES DE RODAR: troque 5511999999999 pelo SEU número (com DDD, sem +55
--     é ok — o sistema normaliza). Precisa existir pelo menos 1 experiência
--     em public.experiences (o seed pega a primeira pro vínculo).
-- =========================================================

do $$
declare
  v_phone   text := '5511999999999';               -- <<< TROQUE PELO SEU NÚMERO
  v_email   text := 'teste-e2e@elarah.com.br';
  v_exp     uuid := (select id from public.experiences order by created_at limit 1);
  v_ev_fut  text := to_char((now() at time zone 'America/Sao_Paulo') + interval '42 hours', 'DD/MM');
  v_hr_fut  text := to_char((now() at time zone 'America/Sao_Paulo') + interval '42 hours', 'HH24"h"MI');
  v_ev_pst  text := to_char((now() at time zone 'America/Sao_Paulo') - interval '48 hours', 'DD/MM');
  v_hr_pst  text := to_char((now() at time zone 'America/Sao_Paulo') - interval '48 hours', 'HH24"h"MI');
begin
  if v_exp is null then
    raise exception 'Nenhuma experiência em public.experiences — crie uma antes de rodar o seed.';
  end if;

  -- 1) LEMBRETE (deve ENVIAR): pago, aguardando=false, evento daqui a ~42h.
  insert into public.bookings (email, nome, telefone, experiencia_id, experiencia_nome,
    data, horario, status, aguardando_experiencia, metadata)
  values (v_email, 'E2E LEMBRETE', v_phone, v_exp, 'E2E — Lembrete 48h',
    v_ev_fut, v_hr_fut, 'pago', false, '{"e2e_teste": true, "caso": "lembrete"}'::jsonb);

  -- 2) FEEDBACK (deve ENVIAR): pago, aguardando=false, evento ~48h atrás.
  insert into public.bookings (email, nome, telefone, experiencia_id, experiencia_nome,
    data, horario, status, aguardando_experiencia, metadata)
  values (v_email, 'E2E FEEDBACK', v_phone, v_exp, 'E2E — Feedback pós',
    v_ev_pst, v_hr_pst, 'pago', false, '{"e2e_teste": true, "caso": "feedback"}'::jsonb);

  -- 3) PENDENTE (deve ENVIAR recuperação): status pending, criado ~4h atrás.
  insert into public.bookings (email, nome, telefone, experiencia_id, experiencia_nome,
    data, horario, status, aguardando_experiencia, metadata, created_at)
  values (v_email, 'E2E PENDENTE', v_phone, v_exp, 'E2E — Recuperação pendente',
    v_ev_fut, v_hr_fut, 'pending', false, '{"e2e_teste": true, "caso": "pendente"}'::jsonb,
    now() - interval '4 hours');

  -- 4) CANCELADO (NÃO deve enviar): candidato na janela do lembrete, status cancelado.
  insert into public.bookings (email, nome, telefone, experiencia_id, experiencia_nome,
    data, horario, status, aguardando_experiencia, metadata)
  values (v_email, 'E2E CANCELADO', v_phone, v_exp, 'E2E — Cancelado',
    v_ev_fut, v_hr_fut, 'cancelado', false, '{"e2e_teste": true, "caso": "cancelado"}'::jsonb);

  -- 5) REEMBOLSADO (NÃO deve enviar): candidato na janela, status reembolsado.
  insert into public.bookings (email, nome, telefone, experiencia_id, experiencia_nome,
    data, horario, status, aguardando_experiencia, metadata)
  values (v_email, 'E2E REEMBOLSADO', v_phone, v_exp, 'E2E — Reembolsado',
    v_ev_fut, v_hr_fut, 'reembolsado', false, '{"e2e_teste": true, "caso": "reembolsado"}'::jsonb);

  -- 6) AGUARDANDO EXPERIÊNCIA (NÃO deve enviar): pago, mas aguardando=true.
  insert into public.bookings (email, nome, telefone, experiencia_id, experiencia_nome,
    data, horario, status, aguardando_experiencia, aguardando_experiencia_at, metadata)
  values (v_email, 'E2E AGUARDANDO', v_phone, v_exp, 'E2E — Aguardando experiência',
    v_ev_fut, v_hr_fut, 'pago', true, now(), '{"e2e_teste": true, "caso": "aguardando"}'::jsonb);

  raise notice 'Seed E2E criado: LEMBRETE(%,%) FEEDBACK(%,%) + PENDENTE/CANCELADO/REEMBOLSADO/AGUARDANDO',
    v_ev_fut, v_hr_fut, v_ev_pst, v_hr_pst;
end $$;

-- Conferir o que foi criado:
select nome, status, aguardando_experiencia, data, horario, telefone, created_at
from public.bookings
where metadata->>'e2e_teste' = 'true'
order by nome;

-- =========================================================
-- LIMPEZA (rode DEPOIS de terminar a Fase 1):
--   delete from public.whatsapp_send_log
--     where booking_id in (select id from public.bookings where metadata->>'e2e_teste'='true');
--   delete from public.bookings where metadata->>'e2e_teste' = 'true';
-- =========================================================
