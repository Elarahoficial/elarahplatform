-- =========================================================
-- ELARAH — Cron de re-materialização da Recorrência semanal (Fase 3)
-- ---------------------------------------------------------
-- PROBLEMA QUE RESOLVE
--   A materialização de datas (experience_slots) só acontece via a
--   trigger `materialize_recurrence_after_change`, ou seja, SÓ quando
--   o admin cria/edita/salva a regra no painel "Recorrência". Não há
--   nada que empurre o horizonte de `horizon_weeks` semanas pra frente
--   conforme o tempo passa.
--
--   Consequência: uma aula com regra ativa, mas que não é re-salva há
--   ~horizon_weeks semanas, tem TODAS as suas datas materializadas
--   escorregando pro passado. O seletor de data do cliente
--   (experiencia.html / modal em script.js) só mostra slot com
--   `event_at >= agora`, então a aula "some" da agenda mesmo continuando
--   ativa e com vagas — foi exatamente o caso das aulas de Tufting 3h
--   (R$ 243), enquanto a de 2h (R$ 162), re-salva mais recentemente,
--   seguia com datas futuras.
--
-- O QUE FAZ
--   Agenda um job diário (pg_cron) que chama
--   `public.materialize_all_active_recurrences()` — função que já existe
--   (criada em elarah_experience_recurrence_rules.sql, seção 6,
--   explicitamente "usada pelo cron diário (Fase 3)"). Ela percorre
--   todas as regras `is_active = true` e materializa os slots futuros
--   que faltam, mantendo o horizonte sempre cheio.
--
-- GARANTIAS (herdadas da função, nada novo aqui)
--   ✅ Idempotente — ON CONFLICT DO NOTHING; rodar todo dia só cria o
--      que falta. Zero duplicação.
--   ✅ Não toca slot existente — reservas pagas, exceções canceladas
--      (is_active=false) e slots manuais ficam intocados.
--   ✅ Não ressuscita cancelamento — data desativada continua desativada.
--   ✅ Regra inativa é ignorada.
--
-- PRÉ-REQUISITOS
--   * pg_cron habilitado (Database → Extensions no painel Supabase).
--   * sql/elarah_experience_recurrence_rules.sql já rodado (define a
--     função materialize_all_active_recurrences).
--
-- REVERSÍVEL
--   select cron.unschedule('elarah-recurrence-materialize-daily');
-- =========================================================


-- 1) Limpa schedule antigo (idempotência — pode rodar a migration
--    várias vezes sem duplicar o job).
do $$
begin
  perform cron.unschedule('elarah-recurrence-materialize-daily');
exception
  when undefined_table then null;  -- pg_cron ainda não habilitada
  when others          then null;  -- job não existia
end $$;


-- 2) Agenda diário às 06h UTC (= 03h BRT, horário de baixo tráfego).
--    Diário (em vez de semanal) mantém o horizonte sempre topado e é
--    barato: a função só insere as datas que faltam.
select cron.schedule(
  'elarah-recurrence-materialize-daily',
  '0 6 * * *',
  $$ select public.materialize_all_active_recurrences(); $$
);


-- 3) EXECUÇÃO IMEDIATA (opcional, mas recomendado agora)
--    Roda uma vez na hora pra reencher o horizonte de todas as regras
--    ativas que já venceram — isto sozinho faz as aulas cujas datas
--    escorregaram pro passado (ex.: Tufting 3h / R$ 243) voltarem a
--    mostrar datas, DESDE QUE elas tenham uma regra ativa cadastrada.
--    (Se a aula não tiver regra nenhuma, crie-a no painel "Recorrência"
--    do admin — o cron não inventa regra, só materializa as existentes.)
select public.materialize_all_active_recurrences() as slots_criados_agora;


-- =========================================================
-- VERIFICAÇÃO
-- ---------------------------------------------------------
-- Job agendado?
--   select jobname, schedule, active
--     from cron.job
--    where jobname = 'elarah-recurrence-materialize-daily';
--
-- Quantas datas futuras cada regra ativa tem agora?
--   select r.id, r.weekdays, r.horario_label, r.horizon_weeks,
--          count(s.id) filter (
--            where s.event_at >= now() and s.is_active
--          ) as datas_futuras
--     from public.experience_recurrence_rules r
--     left join public.experience_slots s
--            on s.recurrence_rule_id = r.id
--    where r.is_active
--    group by r.id
--    order by datas_futuras asc;   -- as com 0 ou poucas datas aparecem no topo
-- =========================================================
