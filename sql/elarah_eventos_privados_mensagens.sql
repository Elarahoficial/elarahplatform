-- =============================================================
-- ELARAH — Eventos privados: mensagens prontas (copiar e colar)
-- -------------------------------------------------------------
-- Guarda os textos que ela usa no dia a dia: primeira abordagem de
-- empresa, primeira resposta a quem pede orçamento, o texto que
-- acompanha o orçamento e os três follow-ups (D+1, D+3, D+7).
--
-- POR QUE NO BANCO E NÃO NO CÓDIGO:
-- tom de mensagem se ajusta toda semana. Se o texto mora no código,
-- cada vírgula vira um deploy — e aí ninguém ajusta, ou a pessoa
-- passa a escrever tudo à mão de novo e a mensagem boa se perde.
--
-- FORMATO: um JSON simples, chave → texto. Chave ausente ou vazia
-- significa "usa o texto padrão do painel", então dá pra editar só
-- uma mensagem sem precisar colar as outras cinco.
--
--   {
--     "prospeccao":        "...",
--     "primeira_resposta": "...",
--     "orcamento":         "...",
--     "followup_1":        "...",
--     "followup_2":        "...",
--     "followup_3":        "..."
--   }
--
-- VARIÁVEIS trocadas na hora de copiar: {{nome}}, {{contato}},
-- {{empresa}}, {{evento}}, {{responsavel}}. Mesma convenção de
-- b2b_prospect_templates.
--
-- Fica como coluna na config (que já é uma linha só) em vez de
-- tabela nova: são seis textos fixos, não uma lista que cresce.
--
-- Aditiva e idempotente — seguro rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =============================================================

alter table public.evento_privado_metas
  add column if not exists mensagens jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
