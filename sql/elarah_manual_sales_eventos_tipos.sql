-- =====================================================================
-- Eventos — novos tipos + "Outro" com texto livre
-- =====================================================================
-- Atualiza os tipos de evento:
--   meu_grupo, aniversario_adulto, aniversario_kids (novos),
--   despedida_solteira, despedida_solteiro, corporativo, outro.
-- Mantém o legado 'aniversario' aceito (pra não quebrar registros antigos).
--
-- "Outro" passa a ter texto livre: a coluna event_type_custom guarda o
-- tipo digitado pela admin quando event_type = 'outro'. Cada texto vira
-- um grupo próprio na "Demanda por tipo".
--
-- Aditivo e idempotente — seguro rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table public.manual_sales
  add column if not exists event_type_custom text;

alter table public.manual_sales
  drop constraint if exists manual_sales_event_type_check;
alter table public.manual_sales
  add constraint manual_sales_event_type_check
  check (event_type is null or event_type in (
    'meu_grupo',
    'aniversario_adulto',
    'aniversario_kids',
    'aniversario',            -- legado
    'despedida_solteira',
    'despedida_solteiro',
    'corporativo',
    'outro'
  ));

notify pgrst, 'reload schema';
