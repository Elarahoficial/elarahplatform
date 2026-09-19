-- =============================================================
-- ELARAH — Conversas de WhatsApp (fase 2: a tela)
-- -------------------------------------------------------------
-- A fase 1 (sql/elarah_whatsapp_inbox.sql) já guarda o que CHEGA. Pra
-- montar uma conversa de verdade falta o outro lado: o que a Elarah
-- MANDOU, no mesmo fio, na mesma ordem.
--
-- O QUE FALTAVA
--   whatsapp_send_log guarda o telefone MASCARADO e não guarda o texto.
--   Foi uma decisão consciente lá atrás (não vazar número em log), mas ela
--   impede exatamente isto: sem número inteiro não dá pra saber a QUAL
--   conversa a mensagem pertence, e sem texto não há o que mostrar.
--
--   Aqui essa decisão é revista, com limite: as colunas novas só são
--   legíveis por admin (RLS abaixo), e phone_masked continua existindo pra
--   quem só quer auditar.
--
-- O QUE ISSO CRIA
--   1. whatsapp_send_log.telefone e .corpo  — o lado ENVIADO da conversa
--   2. leitura por admin nas três tabelas   — a tela lê direto, sem função
--   3. tempo real em whatsapp_mensagens     — a mensagem aparece sozinha
--   4. view whatsapp_conversas              — a LISTA da esquerda, pronta
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

-- ---------- 1) O LADO ENVIADO ----------
alter table public.whatsapp_send_log
  add column if not exists telefone text;

alter table public.whatsapp_send_log
  add column if not exists corpo text;

comment on column public.whatsapp_send_log.telefone is
  'Telefone do destinatário, só dígitos. É o que liga a mensagem enviada à conversa. phone_masked continua existindo pra auditoria.';

comment on column public.whatsapp_send_log.corpo is
  'Texto que foi enviado. Sem ele não há o que mostrar na conversa.';

-- A tela ordena por telefone + tempo o tempo todo.
create index if not exists whatsapp_send_log_telefone_idx
  on public.whatsapp_send_log (telefone, created_at desc);

-- ---------- 2) QUEM PODE LER ----------
-- Só admin. São conversas de clientes: nome, telefone e o que foi dito.
alter table public.whatsapp_send_log enable row level security;
drop policy if exists whatsapp_send_log_admin_read on public.whatsapp_send_log;
create policy whatsapp_send_log_admin_read on public.whatsapp_send_log
  for select using (public.is_admin());

-- Marcar como lida é o único write da tela. Admin pode; mais nada.
drop policy if exists whatsapp_mensagens_admin_update on public.whatsapp_mensagens;
create policy whatsapp_mensagens_admin_update on public.whatsapp_mensagens
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- 3) TEMPO REAL ----------
-- Sem isso a tela só atualiza quando alguém recarrega — e a graça é a
-- mensagem aparecer na hora em que a pessoa manda.
--
-- `add table` dá erro se a tabela já estiver na publicação, e o SQL Editor
-- aborta o script inteiro no primeiro erro. Por isso o bloco condicional.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'whatsapp_mensagens'
  ) then
    alter publication supabase_realtime add table public.whatsapp_mensagens;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'whatsapp_send_log'
  ) then
    alter publication supabase_realtime add table public.whatsapp_send_log;
  end if;
end $$;

-- ---------- 4) A LISTA DA ESQUERDA ----------
-- Uma linha por telefone, com o que a lista de conversas precisa mostrar:
-- quem é, a última mensagem, quantas não lidas, e se a JANELA DE 24H ainda
-- está aberta.
--
-- A janela importa muito: pela regra da Meta, texto livre só é entregue
-- dentro de 24h da última mensagem DA PESSOA. Fora dela, só template
-- aprovado. A tela precisa mostrar isso ANTES de deixar escrever, senão a
-- resposta some sem explicação.
create or replace view public.whatsapp_conversas as
with eventos as (
  select
    telefone,
    nome_perfil,
    wa_timestamp as quando,
    texto,
    'recebida'::text as direcao,
    lida_em
  from public.whatsapp_mensagens
  union all
  select
    telefone,
    null::text as nome_perfil,
    created_at as quando,
    corpo as texto,
    'enviada'::text as direcao,
    created_at as lida_em          -- o que a gente mandou nunca é "não lida"
  from public.whatsapp_send_log
  where coalesce(btrim(telefone), '') <> ''
    and status in ('sent', 'observed')
)
select
  e.telefone,
  max(e.nome_perfil) filter (where e.nome_perfil is not null) as nome_perfil,
  max(e.quando)                                              as ultima_em,
  max(e.quando) filter (where e.direcao = 'recebida')         as ultima_recebida_em,
  count(*) filter (where e.direcao = 'recebida' and e.lida_em is null) as nao_lidas,
  count(*)                                                    as total_mensagens,
  -- Janela de 24h: aberta enquanto a última mensagem DELA tiver menos de
  -- 24 horas. Fechada = só template.
  coalesce(
    max(e.quando) filter (where e.direcao = 'recebida') > now() - interval '24 hours',
    false
  ) as janela_aberta,
  (
    select x.texto from eventos x
     where x.telefone = e.telefone
     order by x.quando desc nulls last
     limit 1
  ) as ultimo_texto,
  (
    select x.direcao from eventos x
     where x.telefone = e.telefone
     order by x.quando desc nulls last
     limit 1
  ) as ultima_direcao
from eventos e
group by e.telefone;

comment on view public.whatsapp_conversas is
  'Uma linha por telefone: última mensagem, não lidas e se a janela de 24h da Meta ainda permite texto livre. É a lista da esquerda da tela de Conversas.';

-- A view roda com os direitos de quem consulta, então o RLS das tabelas
-- de baixo continua valendo (só admin lê).
alter view public.whatsapp_conversas set (security_invoker = on);

notify pgrst, 'reload schema';

-- =============================================================
-- VERIFICAÇÃO
--   -- A lista de conversas, como a tela vai mostrar:
--   select telefone, nome_perfil, nao_lidas, janela_aberta,
--          ultima_direcao, ultimo_texto, ultima_em
--     from whatsapp_conversas
--    order by ultima_em desc;
--
--   -- Uma conversa inteira, os dois lados em ordem:
--   select 'recebida' as quem, wa_timestamp as quando, texto
--     from whatsapp_mensagens where telefone = '5511999990000'
--   union all
--   select 'enviada', created_at, corpo
--     from whatsapp_send_log where telefone = '5511999990000' and status = 'sent'
--   order by quando;
-- =============================================================
