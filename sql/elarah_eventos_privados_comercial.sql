-- =============================================================
-- ELARAH — Comercial de Eventos Privados (aba própria no admin)
-- -------------------------------------------------------------
-- Contexto: existe uma pessoa dedicada a eventos privados/fechados
-- (aniversário, despedida de solteira/solteiro, corporativo). O
-- trabalho dela tem 3 frentes:
--
--   1. PROSPECÇÃO   — falar com RH/People de empresas (30–50/semana).
--                     Base já existe: b2b_prospects + interações.
--   2. ORÇAMENTO    — responder quem chega pedindo evento, mandar
--                     proposta, fazer follow-up até fechar ou perder.
--   3. FECHAMENTO   — virar venda (manual_sales com is_event).
--
-- O que faltava no banco era a frente 2 (pipeline de orçamento com
-- prazo/SLA) e um lugar pra guardar as REGRAS e METAS acordadas —
-- pra aba do admin conseguir dizer, sozinha, "está no prazo?" e
-- "bateu a meta da semana?" sem ninguém precisar lembrar de cabeça.
--
-- Tabelas:
--   evento_privado_metas             — regras do jogo + metas (1 linha)
--   evento_privado_leads             — pipeline de orçamentos
--   evento_privado_lead_interactions — timeline de cada lead
--
-- View:
--   v_eventos_privados_historico     — eventos JÁ FECHADOS, normalizados
--                                      (fonte única da baseline de metas)
--
-- Por que uma tabela de leads separada de b2b_prospects:
--   b2b_prospects = EMPRESA-alvo (prospecção ativa, ciclo longo).
--   evento_privado_leads = PEDIDO DE ORÇAMENTO (pessoa física ou
--   empresa, ciclo curto, com data de evento e SLA de resposta).
--   Um lead pode ter vindo de um b2b_prospect — daí o FK opcional.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- RLS: admin only via public.is_admin().
-- Rode no SQL Editor do Supabase.
-- =============================================================


-- =============================================================
-- 1. evento_privado_metas — as "regrinhas" e as metas
-- -------------------------------------------------------------
-- Uma linha só (id = 1). Fica no banco, e não no código, pra que
-- vocês duas mudem a régua sem depender de deploy — e pra que a
-- combinação fique escrita em algum lugar (evita "mas eu achei
-- que era 3h").
--
-- Metas com valor NULL = a aba calcula sozinha a partir do
-- histórico real (v_eventos_privados_historico) usando o
-- fator_crescimento. Preencher o campo trava a meta no número.
-- =============================================================
create table if not exists public.evento_privado_metas (
  id                            smallint primary key default 1 check (id = 1),

  -- ----- Metas semanais -----
  -- Prospecção: faixa (mínimo aceitável / alvo cheio). Default 30–50,
  -- que é a régua combinada de empresas novas por semana.
  meta_prospeccao_min           integer not null default 30 check (meta_prospeccao_min >= 0),
  meta_prospeccao_max           integer not null default 50 check (meta_prospeccao_max >= 0),
  -- NULL = calculado do histórico (ver comentário do bloco).
  meta_orcamentos_semana        integer check (meta_orcamentos_semana is null or meta_orcamentos_semana >= 0),
  meta_eventos_semana           integer check (meta_eventos_semana is null or meta_eventos_semana >= 0),
  meta_receita_semana_centavos  bigint  check (meta_receita_semana_centavos is null or meta_receita_semana_centavos >= 0),
  -- Quanto pedir acima da média histórica quando a meta é automática.
  -- 1.0 = repetir o histórico; 1.30 = crescer 30%.
  fator_crescimento             numeric(4,2) not null default 1.30 check (fator_crescimento > 0),

  -- ----- SLA (prazos de resposta) -----
  -- Contados em HORAS ÚTEIS: fora do expediente o relógio pausa. Uma
  -- mensagem das 23h não "estoura" às 1h da manhã — ela começa a
  -- contar na abertura do dia seguinte.
  sla_primeira_resposta_horas   numeric(4,1) not null default 2   check (sla_primeira_resposta_horas > 0),
  sla_orcamento_horas           numeric(5,1) not null default 24  check (sla_orcamento_horas > 0),

  -- ----- Expediente -----
  expediente_inicio             time not null default '09:00',
  expediente_fim                time not null default '19:00',
  -- Dias em que o relógio corre. 0=domingo … 6=sábado.
  -- Default seg–sáb (evento é decidido muito no fim de semana).
  expediente_dias               smallint[] not null default '{1,2,3,4,5,6}',

  -- ----- Cadência de follow-up -----
  -- Dias corridos após o orçamento enviado. Default D+1, D+3, D+7:
  -- três toques e depois o lead vira "sem resposta" (não fica
  -- eternamente aberto poluindo o pipeline).
  followup_dias                 smallint[] not null default '{1,3,7}',
  followups_max                 smallint not null default 3 check (followups_max >= 0),

  -- ----- Contexto -----
  responsavel_nome              text,
  observacoes                   text,

  updated_at                    timestamptz not null default now()
);

drop trigger if exists trg_evento_privado_metas_updated_at on public.evento_privado_metas;
create trigger trg_evento_privado_metas_updated_at
  before update on public.evento_privado_metas
  for each row execute function public.set_updated_at();

alter table public.evento_privado_metas enable row level security;

drop policy if exists "evento_privado_metas_admin_all" on public.evento_privado_metas;
create policy "evento_privado_metas_admin_all"
  on public.evento_privado_metas
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Linha única com os defaults combinados.
insert into public.evento_privado_metas (id) values (1)
on conflict (id) do nothing;


-- =============================================================
-- 2. evento_privado_leads — pipeline de orçamento
-- -------------------------------------------------------------
-- Cada linha é UM pedido de evento. Os timestamps do funil
-- (primeira_resposta_at, orcamento_enviado_at, fechado_at) são o
-- que permite medir SLA e conversão sem ninguém preencher
-- relatório: a régua sai do próprio trabalho registrado.
-- =============================================================
create table if not exists public.evento_privado_leads (
  id                       uuid primary key default gen_random_uuid(),

  -- ----- Quem -----
  cliente_nome             text not null,
  whatsapp                 text,
  email                    text,
  empresa                  text,                    -- preenchido quando é corporativo

  -- ----- O evento -----
  tipo_evento              text check (tipo_evento is null or tipo_evento in (
                             'aniversario_adulto',
                             'aniversario_kids',
                             'despedida_solteira',
                             'despedida_solteiro',
                             'corporativo',
                             'meu_grupo',
                             'outro'
                           )),
  tipo_evento_custom       text,                    -- texto livre quando tipo = 'outro'
  data_evento              date,
  pessoas                  integer check (pessoas is null or pessoas > 0),
  experiencia_interesse    text,                    -- "cerâmica", "coquetelaria"…

  -- ----- De onde veio -----
  origem                   text not null default 'outro' check (origem in (
                             'instagram',
                             'whatsapp',
                             'site',
                             'indicacao',
                             'prospeccao_b2b',
                             'google',
                             'evento_anterior',
                             'outro'
                           )),
  -- Quando o lead nasceu de uma empresa prospectada, liga as duas
  -- pontas: dá pra provar que a prospecção virou orçamento.
  b2b_prospect_id          uuid references public.b2b_prospects(id) on delete set null,

  -- ----- Funil -----
  -- 'sem_resposta' = esgotou a cadência de follow-up sem retorno.
  -- Diferente de 'perdido', que é um "não" explícito (com motivo).
  status                   text not null default 'novo' check (status in (
                             'novo',
                             'respondido',
                             'orcamento_enviado',
                             'negociacao',
                             'fechado',
                             'perdido',
                             'sem_resposta'
                           )),
  valor_orcado_centavos    bigint check (valor_orcado_centavos is null or valor_orcado_centavos >= 0),
  valor_fechado_centavos   bigint check (valor_fechado_centavos is null or valor_fechado_centavos >= 0),
  motivo_perda             text,

  -- ----- Prazos (o coração do SLA) -----
  -- lead_at = quando a pessoa CHEGOU (não quando foi cadastrada).
  -- Separado do created_at de propósito: dá pra cadastrar às 14h um
  -- lead que chegou às 9h sem falsear o tempo de resposta.
  lead_at                  timestamptz not null default now(),
  primeira_resposta_at     timestamptz,
  orcamento_enviado_at     timestamptz,
  fechado_at               timestamptz,
  proximo_followup_at      timestamptz,
  ultimo_followup_at       timestamptz,
  followups_count          integer not null default 0 check (followups_count >= 0),

  -- ----- Amarração com a venda -----
  manual_sale_id           uuid references public.manual_sales(id) on delete set null,

  responsavel              text,
  observacoes              text,

  created_by               uuid references auth.users(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- Índices cobrindo as consultas da aba.
create index if not exists evento_privado_leads_status_idx
  on public.evento_privado_leads (status);
create index if not exists evento_privado_leads_lead_at_idx
  on public.evento_privado_leads (lead_at desc);
create index if not exists evento_privado_leads_data_evento_idx
  on public.evento_privado_leads (data_evento)
  where data_evento is not null;
-- "Follow-ups atrasados" — consulta mais frequente do painel.
create index if not exists evento_privado_leads_followup_idx
  on public.evento_privado_leads (proximo_followup_at)
  where proximo_followup_at is not null;
-- "Sem primeira resposta" — o que estoura SLA.
create index if not exists evento_privado_leads_sem_resposta_idx
  on public.evento_privado_leads (lead_at)
  where primeira_resposta_at is null;
create index if not exists evento_privado_leads_b2b_idx
  on public.evento_privado_leads (b2b_prospect_id)
  where b2b_prospect_id is not null;

drop trigger if exists trg_evento_privado_leads_updated_at on public.evento_privado_leads;
create trigger trg_evento_privado_leads_updated_at
  before update on public.evento_privado_leads
  for each row execute function public.set_updated_at();

alter table public.evento_privado_leads enable row level security;

drop policy if exists "evento_privado_leads_admin_all" on public.evento_privado_leads;
create policy "evento_privado_leads_admin_all"
  on public.evento_privado_leads
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================
-- 3. evento_privado_lead_interactions — timeline
-- -------------------------------------------------------------
-- É o "o que ela fez esta semana" em formato auditável. A aba usa
-- pra montar o feed de atividade e pra contar toques por lead.
-- =============================================================
create table if not exists public.evento_privado_lead_interactions (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.evento_privado_leads(id) on delete cascade,
  tipo         text not null check (tipo in (
                 'primeiro_contato',
                 'respondeu_cliente',
                 'orcamento_enviado',
                 'follow_up',
                 'reuniao',
                 'visita_local',
                 'negociacao',
                 'fechado',
                 'perdido',
                 'observacao'
               )),
  descricao    text,
  occurred_at  timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists evento_privado_lead_interactions_lead_idx
  on public.evento_privado_lead_interactions (lead_id, occurred_at desc);
create index if not exists evento_privado_lead_interactions_occurred_idx
  on public.evento_privado_lead_interactions (occurred_at desc);

alter table public.evento_privado_lead_interactions enable row level security;

drop policy if exists "evento_privado_lead_interactions_admin_all" on public.evento_privado_lead_interactions;
create policy "evento_privado_lead_interactions_admin_all"
  on public.evento_privado_lead_interactions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =============================================================
-- 4. v_eventos_privados_historico — baseline das metas
-- -------------------------------------------------------------
-- Fonte ÚNICA da regra "o que conta como evento privado fechado".
-- Espelha exatamente o critério da aba Eventos:
--   is_event = false  → nunca entra (falso positivo já marcado)
--   is_event = true   → sempre entra (evento pequeno, 2 pessoas)
--   caso contrário    → entra se quantity >= 3 ou tem event_type
--
-- Só venda PAGA entra: meta de faturamento não pode se apoiar em
-- orçamento que ainda não virou dinheiro.
--
-- occurred_on usa sale_date (data da venda) com fallback pro
-- created_at — mesma convenção do v_financial_ledger.
-- =============================================================
create or replace view public.v_eventos_privados_historico as
select
  ms.id,
  ms.customer_name,
  ms.experience_name,
  coalesce(ms.sale_date, ms.created_at::date)          as occurred_on,
  ms.slot_date                                          as data_evento,
  ms.quantity                                           as pessoas,
  ms.event_type,
  ms.event_type_custom,
  -- Rótulo já resolvido: 'outro' usa o texto livre digitado.
  case
    when ms.event_type = 'outro'
      then coalesce(nullif(btrim(ms.event_type_custom), ''), 'Outro')
    when ms.event_type is null then 'Sem classificação'
    else ms.event_type
  end                                                   as tipo_label,
  ms.total_amount_centavos                              as ticket_centavos,
  -- Receita Elarah = total - repasse(s). O fornecedor principal está
  -- em payout_amount_centavos; os extras (evento com 2+ fornecedores)
  -- vivem na lista JSON extra_payouts.
  greatest(
    0,
    ms.total_amount_centavos
      - coalesce(ms.payout_amount_centavos, 0)
      - coalesce((
          select sum(coalesce((ep->>'amount_centavos')::bigint, 0))
            from jsonb_array_elements(coalesce(ms.extra_payouts, '[]'::jsonb)) ep
        ), 0)
  )                                                     as receita_elarah_centavos
from public.manual_sales ms
where ms.payment_status = 'pago'
  and coalesce(ms.is_event, (ms.quantity >= 3 or ms.event_type is not null));

notify pgrst, 'reload schema';
