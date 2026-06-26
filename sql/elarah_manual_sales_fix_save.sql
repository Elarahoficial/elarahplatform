-- =====================================================================
-- HOTFIX — "erro ao salvar venda manual / pagamento"
-- =====================================================================
-- Sintoma: editar qualquer venda manual (aba Eventos / Compras /
-- Contabilidade) e clicar em Salvar dá erro, mesmo a venda aparecendo
-- normalmente na lista (Recebido/Saldo/tipo do evento visíveis).
--
-- Causa: o admin SEMPRE envia no UPDATE/INSERT as colunas event_type,
-- is_event, event_type_custom, payments e sale_date. A leitura (select *)
-- ignora coluna ausente — por isso a lista exibe tudo — mas a GRAVAÇÃO
-- quebra quando o payload cita uma coluna que ainda não existe no banco
-- ("Could not find the '<coluna>' column ... in the schema cache").
-- Isso acontece quando uma das migrações abaixo não foi rodada.
--
-- Este script consolida TODAS as colunas que o admin usa + o CHECK de
-- tipo de evento atualizado + reload do schema cache do PostgREST.
--
-- Aditivo e idempotente — seguro rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

-- 1) Data da venda (separada da data do evento / slot_date)
alter table public.manual_sales
  add column if not exists sale_date date;

-- 2) Classificação de evento
alter table public.manual_sales
  add column if not exists event_type        text,
  add column if not exists is_event          boolean,
  add column if not exists event_type_custom text;

-- 3) Cronograma de pagamentos (entrada + parcelas), JSON
alter table public.manual_sales
  add column if not exists payments jsonb not null default '[]'::jsonb;

-- 4) CHECK do event_type alinhado ao dropdown do admin (EVENTO_TIPOS).
--    drop+add pra ser idempotente e cobrir bancos com o CHECK antigo.
alter table public.manual_sales
  drop constraint if exists manual_sales_event_type_check;
alter table public.manual_sales
  add constraint manual_sales_event_type_check
  check (event_type is null or event_type in (
    'meu_grupo',
    'aniversario_adulto',
    'aniversario_kids',
    'aniversario',            -- legado (registros antigos)
    'despedida_solteira',
    'despedida_solteiro',
    'corporativo',
    'outro'
  ));

create index if not exists manual_sales_event_idx
  on public.manual_sales (is_event, event_type);

-- 5) Recarrega o schema cache do PostgREST (sem isto, colunas recém
--    criadas continuam "invisíveis" para a API até o próximo reload).
notify pgrst, 'reload schema';
