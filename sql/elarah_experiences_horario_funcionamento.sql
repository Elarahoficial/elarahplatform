-- =============================================================
-- ELARAH — Horário de funcionamento (agendamento livre / voucher)
-- -------------------------------------------------------------
-- Adiciona a coluna `horario_funcionamento` em public.experiences.
--
-- Quando preenchida, a página da experiência entra em modo "voucher":
--   * mostra o horário de funcionamento em cima;
--   * mostra um seletor de DIA e HORA embaixo (cliente escolhe quando quer);
--   * a agenda de datas fixas some.
-- O dia/hora escolhidos entram no pedido (mesma via dos slots).
--
-- Vazio/null = comportamento normal (agenda de datas/horários fixos).
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
-- =============================================================

alter table public.experiences
  add column if not exists horario_funcionamento text;

-- Refresh do cache do PostgREST pra a coluna nova ficar disponível já.
notify pgrst, 'reload schema';
