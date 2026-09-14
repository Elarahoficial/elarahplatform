-- =============================================================
-- ELARAH — Eventos privados: registro diário (contador)
-- -------------------------------------------------------------
-- POR QUE ESTA TABELA EXISTE (e por que a de leads não serve):
--
-- A primeira versão da aba pedia pra cadastrar CADA pedido de
-- orçamento numa tabela, com SLA e follow-up por lead. Na prática
-- não funciona: os pedidos chegam o dia inteiro no WhatsApp e já
-- são organizados numa lista lá. Cadastrar tudo de novo aqui é
-- trabalho dobrado — e trabalho dobrado não é feito, então o
-- painel ficaria mentindo.
--
-- A troca: em vez de UM REGISTRO POR PEDIDO, é UM REGISTRO POR
-- DIA, com contadores. Leva alguns segundos no fim do dia (ou
-- clicando +1 durante o dia) e é o suficiente pra medir ritmo,
-- conversão e meta. O detalhe de cada conversa continua onde já
-- está: no WhatsApp.
--
-- O que NÃO entra aqui, de propósito:
--   eventos fechados e faturamento — saem sozinhos do financeiro
--   (manual_sales), que é a fonte de verdade sobre dinheiro. Se
--   ela digitasse também, os dois números iam divergir um dia.
--
-- Sobre as tabelas de lead (evento_privado_leads e
-- evento_privado_lead_interactions): saíram da interface e não são
-- mais lidas nem escritas. Ficam no banco porque dropar tabela é
-- irreversível — se estiverem vazias e você quiser limpar, rode
-- à mão:  drop table public.evento_privado_lead_interactions;
--         drop table public.evento_privado_leads;
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- RLS: admin only via public.is_admin().
-- Rode no SQL Editor do Supabase.
-- =============================================================

create table if not exists public.evento_privado_dia (
  -- Uma linha por dia. A data é a chave: evita linha duplicada e
  -- deixa o upsert trivial (on conflict (dia)).
  dia                        date primary key default current_date,

  -- ----- Demanda que chegou -----
  -- Quantos pedidos de orçamento entraram no dia. É o número que
  -- diz se o problema da semana foi falta de lead ou perda de lead.
  pedidos_recebidos          integer not null default 0 check (pedidos_recebidos >= 0),

  -- ----- Trabalho que saiu -----
  orcamentos_enviados        integer not null default 0 check (orcamentos_enviados >= 0),
  followups                  integer not null default 0 check (followups >= 0),

  -- Empresas abordadas FORA do painel (por LinkedIn, indicação,
  -- evento presencial…). As abordadas pelos botões da aba já são
  -- contadas sozinhas em b2b_prospect_interactions — este campo é
  -- só o complemento, pra meta não ficar menor que a realidade.
  empresas_abordadas_extra   integer not null default 0 check (empresas_abordadas_extra >= 0),

  -- ----- Régua de atendimento -----
  -- Quantos pedidos passaram do SLA sem resposta. Na maioria dos
  -- dias é 0; quando não é, a conversa da semana tem assunto.
  fora_do_prazo              integer not null default 0 check (fora_do_prazo >= 0),

  observacoes                text,

  registrado_por             uuid references auth.users(id) on delete set null,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

-- Consulta principal do painel: "últimos N dias", sempre em ordem.
create index if not exists evento_privado_dia_desc_idx
  on public.evento_privado_dia (dia desc);

drop trigger if exists trg_evento_privado_dia_updated_at on public.evento_privado_dia;
create trigger trg_evento_privado_dia_updated_at
  before update on public.evento_privado_dia
  for each row execute function public.set_updated_at();

alter table public.evento_privado_dia enable row level security;

drop policy if exists "evento_privado_dia_admin_all" on public.evento_privado_dia;
create policy "evento_privado_dia_admin_all"
  on public.evento_privado_dia
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
