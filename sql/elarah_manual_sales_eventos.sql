-- =====================================================================
-- Eventos (grupos fechados) — classificação de vendas manuais
-- =====================================================================
-- A aba Eventos do admin acompanha a demanda de eventos de grupo fechado
-- (aniversário, despedida de solteira/solteiro, corporativo). Esses são,
-- na prática, vendas manuais com mais de 2 pessoas.
--
-- Adiciona duas colunas em manual_sales:
--   event_type : tipo do evento (null = não classificado)
--   is_event   : controle de inclusão na aba Eventos
--                  null  → automático (entra se quantity >= 3)
--                  true  → forçado a entrar (ex.: evento com 2 pessoas)
--                  false → removido da aba (ex.: família de 4 numa compra
--                          normal, não é evento)
--
-- Aditivo e idempotente — seguro rodar quantas vezes quiser.
-- Rode no SQL Editor do Supabase.
-- =====================================================================

alter table public.manual_sales
  add column if not exists event_type text,
  add column if not exists is_event   boolean;

-- CHECK do event_type (drop+add pra ser idempotente).
alter table public.manual_sales
  drop constraint if exists manual_sales_event_type_check;
alter table public.manual_sales
  add constraint manual_sales_event_type_check
  check (event_type is null or event_type in
    ('aniversario','despedida_solteira','despedida_solteiro','corporativo','outro'));

create index if not exists manual_sales_event_idx
  on public.manual_sales (is_event, event_type);

notify pgrst, 'reload schema';
