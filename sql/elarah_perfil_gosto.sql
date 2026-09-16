-- =====================================================================
-- ELARAH — Perfil de Gosto (captura de dados + motor de match)
-- ---------------------------------------------------------------------
-- PROBLEMA QUE ISSO RESOLVE
--   A gente não sabe pra QUEM mandar cada experiência nova. Manda pra
--   todo mundo, converte pouco. Formulário não resolve: ninguém
--   responde (a prova é que nem a avaliação, que é 1 clique, volta).
--
-- A APOSTA
--   1. Parar de PERGUNTAR o que já dá pra DEDUZIR. O banco já guarda
--      o que cada pessoa olhou (analytics_events), o que comprou
--      (bookings), o que pediu na espera (interesses) e o que achou
--      (reviews). Isso é perfil de gosto de graça, sem formulário.
--   2. Quando perguntar, perguntar 1 toque, no pico emocional
--      (logo depois de pagar) e com recompensa egoísta
--      ("receba o que combina com você"), nunca altruísta
--      ("ajude a Elarah").
--   3. Transformar os dois em UMA lista: "pra esta experiência, estas
--      são as 30 pessoas mais prováveis de comprar, com o WhatsApp
--      pronto e o motivo do match".
--
-- O QUE ESTE ARQUIVO CRIA
--   taste_responses          — tabela append-only: cada toque vira 1 linha
--   taste_profiles           — view: consolida as respostas por pessoa
--   analytics_identities     — view: liga sessão anônima → e-mail
--   taste_behavior           — view: gosto DEDUZIDO (views + compras)
--   taste_pessoas            — view 360º: declarado + deduzido, 1 linha/pessoa
--   match_pessoas_experiencia() — RPC: ranking de quem avisar
--   taste_capture_stats()       — RPC: a captura está funcionando?
--
-- COMO RODAR
--   SQL Editor do Supabase → cole tudo → Run. É IDEMPOTENTE: pode
--   rodar quantas vezes quiser, não duplica nada.
--   Requer PostgreSQL 15 ou mais novo (as views usam
--   security_invoker, que não existe no 14). Todo projeto Supabase
--   atual atende; se der erro em "with (security_invoker = true)",
--   é sinal de banco antigo — avise antes de mexer no arquivo.
--
-- PRÉ-REQUISITOS (já rodados no projeto)
--   elarah_supabase_setup.sql      (profiles, experiences, is_admin, set_updated_at)
--   elarah_bookings.sql            (bookings)
--   elarah_byelarah_analytics.sql  (analytics_events)
--   elarah_reviews.sql             (reviews)
--   elarah_interesses.sql          (interesses)
--   elarah_email_broadcasts.sql    (email_opt_outs)
--   Todos já rodados neste projeto. Views no Postgres são validadas na
--   criação, então não dá pra "ignorar tabela ausente" com to_regclass:
--   se algum pré-requisito faltar, rode-o antes.
-- =====================================================================


-- =====================================================================
-- 0. HELPERS
-- =====================================================================

-- Normaliza e-mail: minúsculo, sem espaço, '' vira null. Toda junção
-- por e-mail neste arquivo passa por aqui — sem isso "Ana@Gmail.com"
-- e "ana@gmail.com " viram duas pessoas diferentes.
create or replace function public.elarah_norm_email(p text)
returns text
language sql
immutable
as $$
  select nullif(lower(trim(coalesce(p, ''))), '');
$$;

-- Normaliza telefone brasileiro pra só dígitos com DDI 55.
--   "(11) 91234-5678" → "5511912345678"
-- Assim o mesmo número escrito de 4 jeitos vira uma pessoa só.
create or replace function public.elarah_norm_fone(p text)
returns text
language plpgsql
immutable
as $$
declare
  d text;
begin
  d := regexp_replace(coalesce(p, ''), '\D', '', 'g');
  if length(d) < 10 then return null; end if;
  -- tira zeros de operadora/DDD à esquerda
  d := regexp_replace(d, '^0+', '');
  if length(d) in (10, 11) then d := '55' || d; end if;
  if length(d) < 12 or length(d) > 13 then return null; end if;
  return d;
end;
$$;

-- Slug de categoria: sem acento, minúsculo, sem espaço.
--   "Cerâmica" → "ceramica" | "Macramê" → "macrame"
-- Categoria no catálogo é texto livre digitado pela admin, então
-- comparar sem isso erra em metade dos casos.
create or replace function public.elarah_slug(p text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      lower(translate(trim(coalesce(p, '')),
        'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
        'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
      '[^a-z0-9]+', '_', 'g'),
    '');
$$;


-- =====================================================================
-- 1. taste_responses — onde cai cada toque
-- ---------------------------------------------------------------------
-- APPEND-ONLY de propósito. Cada vez que alguém toca num chip, entra
-- uma linha nova; nada é sobrescrito. Três motivos:
--   * upsert por e-mail exigiria dar UPDATE pro anon (qualquer um
--     poderia reescrever o perfil de qualquer pessoa);
--   * dá pra ver a evolução do gosto ("em março queria cerâmica, em
--     agosto gastronomia");
--   * perfil parcial é útil: quem tocou 1 chip e fechou a aba já
--     deixou o dado. O widget salva a cada toque, não no fim.
-- A consolidação em 1 linha por pessoa fica na view taste_profiles.
-- =====================================================================

create table if not exists public.taste_responses (
  id             uuid primary key default gen_random_uuid(),

  -- Quem (tudo opcional: a pessoa pode responder o quiz sem se
  -- identificar e só deixar o WhatsApp no fim — o dado de gosto
  -- vale mesmo anônimo, pra saber o que o público quer).
  email          text,
  telefone       text,
  nome           text,
  user_id        uuid references auth.users(id) on delete set null,
  booking_id     uuid references public.bookings(id) on delete set null,

  -- De onde veio o toque. Serve pra medir qual ponto de captura
  -- funciona (ver taste_capture_stats()).
  origem         text not null default 'pos_compra'
                 check (origem in ('pos_compra','avaliacao','quiz','whatsapp','admin','newsletter','site')),

  -- O QUE a pessoa quer viver. Slugs das categorias do catálogo
  -- (ceramica, gastronomia, tufting, vela, ...). Array porque
  -- ninguém gosta de uma coisa só.
  tags           text[] not null default '{}',
  -- COM QUEM costuma vir: namorado, amigas, sozinha, familia,
  -- trabalho, filhos. Muda completamente o que oferecer.
  companhia      text[] not null default '{}',
  -- QUANTO costuma investir: ate_150 | 150_250 | 250_400 | 400_mais
  faixa_preco    text,
  -- POR QUE sai de casa: aniversario, date, presente, autocuidado,
  -- comemorar, sem_motivo. É o gancho da mensagem de venda.
  momento        text,
  -- Texto livre curto ("queria muito uma aula de vitral"). Opcional,
  -- last resort — a maioria não digita, e tudo bem.
  desejo         text,
  -- Autorizou receber no WhatsApp. Sem isso, não dispara.
  whatsapp_optin boolean not null default false,

  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),

  -- Guarda-corpo contra flood: nada de payload gigante vindo do anon.
  constraint taste_responses_desejo_len check (char_length(coalesce(desejo, '')) <= 500),
  constraint taste_responses_tags_len   check (cardinality(tags) <= 20),
  constraint taste_responses_nome_len   check (char_length(coalesce(nome, '')) <= 120)
);

create index if not exists taste_responses_email_idx
  on public.taste_responses (public.elarah_norm_email(email))
  where email is not null;
create index if not exists taste_responses_fone_idx
  on public.taste_responses (public.elarah_norm_fone(telefone))
  where telefone is not null;
create index if not exists taste_responses_created_idx on public.taste_responses (created_at desc);
create index if not exists taste_responses_origem_idx  on public.taste_responses (origem);
create index if not exists taste_responses_tags_idx    on public.taste_responses using gin (tags);
create index if not exists taste_responses_booking_idx on public.taste_responses (booking_id);

comment on table public.taste_responses is
  'Append-only. Cada toque no widget de perfil de gosto vira 1 linha. Consolide pela view taste_profiles.';

-- ---------- RLS ----------
-- Modelo "caixa de correio": o site escreve, só o admin lê.
-- É o MESMO padrão já usado em analytics_events (insert público,
-- select só admin) — e a razão é a mesma: o dado precisa entrar sem
-- login (a pessoa acabou de comprar e nem sempre tem conta), mas
-- ninguém de fora pode listar a base de clientes.
alter table public.taste_responses enable row level security;

drop policy if exists taste_responses_insert_public on public.taste_responses;
create policy taste_responses_insert_public
  on public.taste_responses
  for insert to anon, authenticated
  with check (true);

drop policy if exists taste_responses_admin_read on public.taste_responses;
create policy taste_responses_admin_read
  on public.taste_responses
  for select to authenticated
  using (public.is_admin());

drop policy if exists taste_responses_admin_write on public.taste_responses;
create policy taste_responses_admin_write
  on public.taste_responses
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists taste_responses_admin_delete on public.taste_responses;
create policy taste_responses_admin_delete
  on public.taste_responses
  for delete to authenticated
  using (public.is_admin());


-- =====================================================================
-- 2. taste_profiles — 1 linha por pessoa (o que ela DECLAROU)
-- ---------------------------------------------------------------------
-- Junta todas as respostas da mesma pessoa. Chave: e-mail normalizado
-- quando existe; senão, telefone normalizado. Quem respondeu sem
-- nenhum dos dois fica de fora daqui (mas continua contando nas
-- estatísticas agregadas de taste_capture_stats).
-- Tags/companhia são UNIÃO de tudo que ela já tocou; faixa_preco,
-- momento e desejo ficam com o valor MAIS RECENTE (gosto muda).
-- =====================================================================

create or replace view public.taste_profiles
  with (security_invoker = true) as
with base as (
  -- O contato pode vir de dois jeitos: a página mandou (caso da tela
  -- pós-compra, que já conhece a cliente) ou só mandou o booking_id
  -- (caso do link de avaliação, que roda sem sessão e não deve
  -- receber dado pessoal no navegador). O join com bookings resolve
  -- o segundo caso AQUI, no banco: a resposta chega anônima e sai
  -- identificada, sem a página nunca ter visto o e-mail de ninguém.
  select
    coalesce(
      public.elarah_norm_email(coalesce(r.email, b.email)),
      'fone:' || public.elarah_norm_fone(coalesce(r.telefone, b.telefone))
    )                                                          as pessoa_key,
    public.elarah_norm_email(coalesce(r.email, b.email))       as email,
    public.elarah_norm_fone(coalesce(r.telefone, b.telefone))  as telefone,
    nullif(trim(coalesce(r.nome, b.nome, '')), '')             as nome,
    coalesce(r.user_id, b.user_id) as user_id,
    r.origem, r.tags, r.companhia, r.faixa_preco, r.momento, r.desejo,
    r.whatsapp_optin, r.created_at
  from public.taste_responses r
  left join public.bookings b on b.id = r.booking_id
  where public.elarah_norm_email(coalesce(r.email, b.email)) is not null
     or public.elarah_norm_fone(coalesce(r.telefone, b.telefone)) is not null
),
-- Tags e companhia saem em CTEs próprias: array_agg() de arrays exige
-- que todos tenham a mesma dimensão (senão o Postgres estoura
-- "cannot accumulate arrays of different dimensionality"). Desmontando
-- com unnest antes de agregar, o problema não existe.
tags_agg as (
  select b.pessoa_key, array_agg(distinct t) as tags
    from base b, unnest(b.tags) t
   where t is not null and t <> ''
   group by b.pessoa_key
),
comp_agg as (
  select b.pessoa_key, array_agg(distinct c) as companhia
    from base b, unnest(b.companhia) c
   where c is not null and c <> ''
   group by b.pessoa_key
)
select
  b.pessoa_key,
  -- Para cada campo: o valor mais recente que NÃO seja nulo. O filter
  -- tira os nulos antes de ordenar, então [1] é a última resposta em
  -- que a pessoa realmente preencheu aquele campo — ela pode ter dito
  -- a faixa de preço numa sessão e o momento em outra.
  (array_agg(b.email       order by b.created_at desc) filter (where b.email       is not null))[1] as email,
  (array_agg(b.telefone    order by b.created_at desc) filter (where b.telefone    is not null))[1] as telefone,
  (array_agg(b.nome        order by b.created_at desc) filter (where b.nome        is not null))[1] as nome,
  (array_agg(b.user_id     order by b.created_at desc) filter (where b.user_id     is not null))[1] as user_id,
  coalesce(t.tags, '{}')                                                                           as tags,
  coalesce(c.companhia, '{}')                                                                      as companhia,
  (array_agg(b.faixa_preco order by b.created_at desc) filter (where b.faixa_preco is not null))[1] as faixa_preco,
  (array_agg(b.momento     order by b.created_at desc) filter (where b.momento     is not null))[1] as momento,
  (array_agg(b.desejo      order by b.created_at desc) filter (where b.desejo      is not null))[1] as desejo,
  bool_or(b.whatsapp_optin)                                                                        as whatsapp_optin,
  count(*)                                                                                         as respostas,
  array_agg(distinct b.origem)                                                                     as origens,
  min(b.created_at)                                                                                as primeira_resposta,
  max(b.created_at)                                                                                as ultima_resposta
from base b
left join tags_agg t on t.pessoa_key = b.pessoa_key
left join comp_agg c on c.pessoa_key = b.pessoa_key
group by b.pessoa_key, t.tags, c.companhia;

comment on view public.taste_profiles is
  'Gosto DECLARADO: consolida taste_responses em 1 linha por pessoa (chave = e-mail, ou telefone quando nao ha e-mail).';


-- =====================================================================
-- 3. analytics_identities — liga sessão anônima ao e-mail
-- ---------------------------------------------------------------------
-- ESTA É A PARTE QUE VALE OURO e não custa nada pra cliente.
-- analytics_events grava tudo que a pessoa olha, mas com session_id
-- anônimo. Só que no fim do funil a MESMA sessão dispara
-- 'payment_approved' com o booking_id no metadata — e o booking tem
-- e-mail. Então dá pra voltar no tempo e dizer:
--   "esta sessão, que olhou cerâmica 4x antes de comprar, é a Ana".
-- Resultado: o histórico de navegação vira perfil de gosto com nome
-- e WhatsApp, retroativo, sem ter perguntado nada a ninguém.
-- =====================================================================

create or replace view public.analytics_identities
  with (security_invoker = true) as
with por_user as (
  -- caminho fácil: a pessoa estava logada
  select distinct e.session_id, public.elarah_norm_email(p.email) as email
    from public.analytics_events e
    join public.profiles p on p.id = e.user_id
   where e.session_id is not null and e.user_id is not null
),
por_booking as (
  -- caminho bom: a sessão fechou compra, o booking tem o e-mail
  select distinct e.session_id, public.elarah_norm_email(b.email) as email
    from public.analytics_events e
    join public.bookings b
      on b.id = nullif(coalesce(e.metadata->>'booking_id', e.target_id), '')::uuid
   where e.session_id is not null
     and coalesce(e.metadata->>'booking_id', e.target_id) ~
         '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
),
por_stripe as (
  -- caminho do checkout Stripe: metadata traz a session do Stripe
  select distinct e.session_id, public.elarah_norm_email(b.email) as email
    from public.analytics_events e
    join public.bookings b on b.stripe_session_id = e.metadata->>'stripe_session_id'
   where e.session_id is not null and e.metadata->>'stripe_session_id' is not null
)
select session_id, email from por_user    where email is not null
union
select session_id, email from por_booking where email is not null
union
select session_id, email from por_stripe  where email is not null;

comment on view public.analytics_identities is
  'session_id anônimo → e-mail, deduzido por login, booking_id ou stripe_session_id. Permite atribuir navegação a pessoas.';


-- =====================================================================
-- 4. taste_behavior — o gosto DEDUZIDO (ninguém respondeu nada)
-- ---------------------------------------------------------------------
-- Três fontes, com pesos diferentes porque valem coisas diferentes:
--   comprou   (peso 3) — prova máxima, mas satura (já viveu)
--   olhou     (peso 1) — intenção pura, ótimo pra quem ainda não comprou
--   esperou   (peso 4) — pediu explicitamente na lista de interesses
-- Janela de 365 dias: gosto de 2 anos atrás não paga a conta.
-- =====================================================================

create or replace view public.taste_behavior
  with (security_invoker = true) as
with visto as (
  select
    i.email,
    public.elarah_slug(coalesce(
      -- experiencia.html manda a categoria no metadata do detail_view;
      -- é a fonte mais confiável.
      nullif(e.metadata->>'experiencia_categoria', ''),
      nullif(e.metadata->>'categoria', ''),
      -- senão, resolve pela experiência apontada pelo evento
      (select ex.categoria from public.experiences ex
        where ex.id::text = e.target_id limit 1),
      (select ex.categoria from public.experiences ex
        where lower(ex.nome) = lower(coalesce(e.target_label, '')) limit 1)
    )) as tag,
    count(*)          as peso,
    max(e.created_at) as ultimo
  from public.analytics_events e
  join public.analytics_identities i on i.session_id = e.session_id
  where e.created_at > now() - interval '365 days'
    -- só eventos de INTENÇÃO. page_view fica de fora de propósito:
    -- rolar a home não diz nada sobre gosto e polui todo mundo com
    -- todas as tags.
    and e.event_name in ('experience_detail_view','experience_card_click',
                         'reserve_click','favorite_click','checkout_started',
                         'category_filter_used','category_nav_click')
  group by 1, 2
),
comprado as (
  select
    public.elarah_norm_email(b.email)                              as email,
    public.elarah_slug(coalesce(ex.categoria, b.experiencia_nome)) as tag,
    count(*) * 3                                                   as peso,
    max(b.created_at)                                              as ultimo
  from public.bookings b
  left join public.experiences ex on ex.id = b.experiencia_id
  where b.status = 'pago'
    and b.created_at > now() - interval '365 days'
    and public.elarah_norm_email(b.email) is not null
  group by 1, 2
),
esperando as (
  -- A lista de espera guarda WhatsApp, não e-mail. Casando o telefone
  -- normalizado com o de alguma reserva, o pedido explícito ("me avisa
  -- quando abrir cerâmica") entra no perfil da pessoa certa — e é o
  -- sinal mais forte que existe, por isso peso 4.
  select
    public.elarah_norm_email(b.email) as email,
    public.elarah_slug(i.categoria)   as tag,
    4                                 as peso,
    i.created_at                      as ultimo
  from public.interesses i
  join public.bookings b
    on public.elarah_norm_fone(b.telefone) = public.elarah_norm_fone(i.whatsapp)
  where i.status = 'aguardando'
    and public.elarah_norm_fone(i.whatsapp) is not null
),
tudo as (
  select email, tag, peso, ultimo from visto
  union all
  select email, tag, peso, ultimo from comprado
  union all
  select email, tag, peso, ultimo from esperando
)
select email, tag, sum(peso)::int as peso, max(ultimo) as ultimo
  from tudo
 where tag is not null and email is not null
 group by email, tag;

comment on view public.taste_behavior is
  'Gosto DEDUZIDO por e-mail: peso por tag somando o que a pessoa olhou (1x), comprou (3x) e pediu na lista de espera (4x). Zero perguntas.';


-- =====================================================================
-- 5. taste_pessoas — a base 360º, 1 linha por pessoa
-- ---------------------------------------------------------------------
-- É o que a aba "Perfil de gosto" do admin lista. Junta:
--   contato  (e-mail, WhatsApp, nome)   ← bookings + profiles + respostas
--   gosto declarado                      ← taste_profiles
--   gosto deduzido                       ← taste_behavior
--   histórico  (quanto gastou, quando, nota que deu)
-- =====================================================================

create or replace view public.taste_pessoas
  with (security_invoker = true) as
with contatos as (
  select public.elarah_norm_email(b.email) as email,
         max(nullif(trim(b.nome), ''))     as nome,
         max(public.elarah_norm_fone(b.telefone)) as telefone,
         count(*) filter (where b.status = 'pago')            as compras,
         coalesce(sum(b.amount_total) filter (where b.status = 'pago'), 0) as gasto_centavos,
         max(b.created_at) filter (where b.status = 'pago')   as ultima_compra,
         max(b.user_id::text)::uuid                           as user_id
    from public.bookings b
   where public.elarah_norm_email(b.email) is not null
   group by 1
  union all
  select public.elarah_norm_email(p.email), max(nullif(trim(p.nome), '')),
         max(public.elarah_norm_fone(p.telefone)), 0, 0, null::timestamptz, max(p.id::text)::uuid
    from public.profiles p
   where public.elarah_norm_email(p.email) is not null
   group by 1
  union all
  select email, max(nome), max(telefone), 0, 0, null::timestamptz, max(user_id::text)::uuid
    from public.taste_profiles
   where email is not null
   group by 1
),
pessoas as (
  select email,
         max(nome)            as nome,
         max(telefone)        as telefone,
         max(compras)         as compras,
         max(gasto_centavos)  as gasto_centavos,
         max(ultima_compra)   as ultima_compra,
         max(user_id::text)::uuid as user_id
    from contatos
   group by email
),
deduzido as (
  select email,
         array_agg(tag order by peso desc, ultimo desc) as tags_deduzidas,
         sum(peso)::int                                 as engajamento
    from public.taste_behavior
   group by email
),
notas as (
  select public.elarah_norm_email(b.email) as email,
         round(avg(r.nota)::numeric, 2)    as nota_media,
         count(*)                          as avaliacoes
    from public.reviews r
    join public.bookings b on b.id = r.booking_id
    group by 1
)
select
  p.email,
  coalesce(tp.nome, p.nome)                            as nome,
  coalesce(tp.telefone, p.telefone)                    as telefone,
  p.user_id,
  coalesce(tp.tags, '{}')                              as tags_declaradas,
  coalesce(d.tags_deduzidas, '{}')                     as tags_deduzidas,
  -- lista final de interesse: declarado primeiro (vale mais), deduzido
  -- depois, sem repetir
  (select array_agg(distinct t) from unnest(
      coalesce(tp.tags, '{}'::text[]) || coalesce(d.tags_deduzidas, '{}'::text[])
   ) t where t is not null)                            as tags,
  coalesce(tp.companhia, '{}')                         as companhia,
  tp.faixa_preco,
  tp.momento,
  tp.desejo,
  coalesce(tp.whatsapp_optin, false)                   as whatsapp_optin,
  coalesce(tp.respostas, 0)                            as respostas,
  tp.ultima_resposta,
  coalesce(d.engajamento, 0)                           as engajamento,
  p.compras,
  round(p.gasto_centavos / 100.0, 2)                   as gasto_reais,
  p.ultima_compra,
  n.nota_media,
  coalesce(n.avaliacoes, 0)                            as avaliacoes,
  -- classificação simples pra admin filtrar de bate-pronto
  case
    when p.compras >= 2                              then 'recorrente'
    when p.compras = 1                               then 'cliente'
    when coalesce(d.engajamento, 0) >= 3             then 'quente'
    when coalesce(tp.respostas, 0) > 0               then 'interessada'
    else 'fria'
  end                                                  as estagio
from pessoas p
left join public.taste_profiles tp on tp.email = p.email
left join deduzido d               on d.email  = p.email
left join notas n                  on n.email  = p.email;

comment on view public.taste_pessoas is
  'Base 360º: 1 linha por pessoa com contato, gosto declarado, gosto deduzido, histórico de compra e estágio.';

-- Views nunca ficam expostas ao site público — só o admin lê,
-- pelo RLS das tabelas de origem + este revoke explícito.
revoke all on public.taste_profiles       from public, anon;
revoke all on public.taste_behavior       from public, anon;
revoke all on public.taste_pessoas        from public, anon;
revoke all on public.analytics_identities from public, anon;
grant select on public.taste_profiles       to authenticated;
grant select on public.taste_behavior       to authenticated;
grant select on public.taste_pessoas        to authenticated;
-- POR QUE TODA VIEW AQUI TEM security_invoker = true
--   Sem isso, view no Postgres roda como o DONO (postgres) e passa
--   por cima do RLS das tabelas de origem. Como "authenticated" é
--   toda cliente logada (não só a admin), um simples
--       select * from taste_pessoas
--   devolveria nome, e-mail e telefone da base inteira pra qualquer
--   pessoa com conta no site. Com security_invoker, a view roda com
--   as permissões de QUEM CHAMA: a admin enxerga tudo (policy
--   is_admin()), a cliente comum enxerga no máximo as próprias
--   reservas. O grant abaixo abre a porta; o RLS é quem decide o que
--   passa por ela.
-- analytics_identities NÃO é liberada nem pra authenticated: ela liga
-- sessão de navegação a e-mail, e ninguém precisa dela diretamente.


-- =====================================================================
-- 6. match_pessoas_experiencia() — "pra quem eu mando ISSO?"
-- ---------------------------------------------------------------------
-- A pergunta que a Elara faz toda vez que sobe uma experiência nova.
-- Devolve as pessoas ordenadas por probabilidade de comprar ESTA
-- experiência, com o motivo escrito em português e o WhatsApp pronto.
--
-- PONTUAÇÃO (0-100, somatória capada)
--   +40  declarou querer essa categoria           ← o dado mais forte
--   +30  está na lista de espera dessa categoria  ← pediu com todas as letras
--   +18  tem histórico com essa categoria (olhou/comprou/pediu)
--   +12  já olhou ESTA experiência especificamente
--   +15  já comprou nessa categoria (gostou do tipo)
--   +10  faixa de preço declarada bate com o preço
--   +12  é cliente recorrente (2+ compras)
--   +8   avaliou alguma experiência com 4-5 estrelas
--   +6   autorizou WhatsApp (dá pra falar com ela hoje)
--   -35  JÁ comprou exatamente esta experiência    ← não repete oferta
--
-- Sempre exclui quem pediu descadastro (email_opt_outs).
-- =====================================================================

create or replace function public.match_pessoas_experiencia(
  p_experiencia_id uuid default null,
  p_categoria      text default null,
  p_preco_reais    numeric default null,
  p_limit          int  default 50,
  p_somente_whatsapp boolean default false
)
returns table (
  email        text,
  nome         text,
  telefone     text,
  score        int,
  motivos      text[],
  estagio      text,
  compras      bigint,
  gasto_reais  numeric,
  ja_comprou   boolean,
  whatsapp_optin boolean,
  tags         text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat   text;
  v_preco numeric;
begin
  -- SECURITY DEFINER dá acesso total ao banco, então a primeira linha
  -- do corpo é a trava: só admin logado passa daqui.
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  -- Categoria e preço: usa o que foi passado; o que faltar vem da
  -- experiência. O preço no catálogo é texto livre ("R$ 1.250,00"),
  -- então tira o ponto de milhar, corta na vírgula dos centavos e
  -- só então converte — senão "R$ 1.250" viraria 1250,00 ou 1.
  if p_experiencia_id is not null then
    select public.elarah_slug(coalesce(p_categoria, ex.categoria)),
           coalesce(p_preco_reais,
             nullif(regexp_replace(
               split_part(replace(coalesce(ex.preco, ''), '.', ''), ',', 1),
               '[^0-9]', '', 'g'), '')::numeric)
      into v_cat, v_preco
      from public.experiences ex
     where ex.id = p_experiencia_id;
  end if;

  if v_cat   is null then v_cat   := public.elarah_slug(p_categoria); end if;
  if v_preco is null then v_preco := p_preco_reais; end if;

  if v_cat is null then
    raise exception 'Informe a experiência ou a categoria';
  end if;

  return query
  with alvo as (
    select p.*,
      -- já comprou EXATAMENTE esta experiência?
      exists (
        select 1 from public.bookings b
         where public.elarah_norm_email(b.email) = p.email
           and b.status = 'pago'
           and b.experiencia_id = p_experiencia_id
      ) as comprou_essa,
      -- já olhou esta experiência específica?
      exists (
        select 1
          from public.analytics_events e
          join public.analytics_identities ai on ai.session_id = e.session_id
         where ai.email = p.email
           and p_experiencia_id is not null
           and (e.target_id = p_experiencia_id::text)
           and e.created_at > now() - interval '365 days'
      ) as olhou_essa,
      -- está na lista de espera DESSA categoria? É o sinal mais forte
      -- que existe (ela pediu com todas as letras) e merece motivo
      -- próprio: a mensagem que se manda pra quem pediu é outra —
      -- "abriu o que você pediu" em vez de "achei que você ia gostar".
      exists (
        select 1 from public.interesses i
         where public.elarah_norm_fone(i.whatsapp) = p.telefone
           and public.elarah_slug(i.categoria) = v_cat
           and i.status = 'aguardando'
      ) as pediu_espera
    from public.taste_pessoas p
   where p.email is not null
     and (not p_somente_whatsapp or (p.telefone is not null and p.whatsapp_optin))
     -- respeita descadastro
     and not exists (select 1 from public.email_opt_outs o where o.email = p.email)
  ),
  pontuado as (
    select a.*,
      least(100,
          case when v_cat = any(a.tags_declaradas) then 40 else 0 end
        + case when v_cat = any(a.tags_deduzidas) then 18 else 0 end
        + case when a.pediu_espera then 30 else 0 end
        + case when a.olhou_essa then 12 else 0 end
        + case when exists (
              select 1 from public.bookings b
                left join public.experiences ex2 on ex2.id = b.experiencia_id
               where public.elarah_norm_email(b.email) = a.email
                 and b.status = 'pago'
                 and public.elarah_slug(coalesce(ex2.categoria, b.experiencia_nome)) = v_cat
            ) then 15 else 0 end
        + case when v_preco is null or a.faixa_preco is null then 0
               when a.faixa_preco = 'ate_150'  and v_preco <= 150 then 10
               when a.faixa_preco = '150_250'  and v_preco between 120 and 280 then 10
               when a.faixa_preco = '250_400'  and v_preco between 220 and 450 then 10
               when a.faixa_preco = '400_mais' and v_preco >= 350 then 10
               else 0 end
        + case when a.compras >= 2 then 12 else 0 end
        + case when coalesce(a.nota_media, 0) >= 4 then 8 else 0 end
        + case when a.whatsapp_optin and a.telefone is not null then 6 else 0 end
      ) - case when a.comprou_essa then 35 else 0 end as score_calc
    from alvo a
  )
  select
    q.email, q.nome, q.telefone, greatest(0, q.score_calc)::int,
    array_remove(array[
      case when v_cat = any(q.tags_declaradas) then 'disse que quer ' || v_cat end,
      case when q.pediu_espera                 then 'PEDIU na lista de espera' end,
      -- tags_deduzidas junta o que a pessoa olhou, comprou e pediu —
      -- então o motivo não pode afirmar "olhou", que seria mentira
      -- pra quem só comprou. "Histórico" cobre os três sem inventar.
      case when v_cat = any(q.tags_deduzidas)  then 'histórico com ' || v_cat end,
      case when q.olhou_essa                   then 'viu esta experiência' end,
      case when q.compras >= 2                 then 'cliente recorrente (' || q.compras || ' compras)' end,
      case when q.compras = 1                  then 'já comprou 1 vez' end,
      case when coalesce(q.nota_media, 0) >= 4 then 'avaliou com ' || q.nota_media || '★' end,
      case when q.whatsapp_optin and q.telefone is not null then 'autorizou WhatsApp' end,
      case when q.comprou_essa                 then '⚠ já viveu ESTA experiência' end
    ], null),
    q.estagio, q.compras, q.gasto_reais, q.comprou_essa, q.whatsapp_optin, q.tags
  from pontuado q
  where q.score_calc > 0
  order by q.score_calc desc, q.compras desc, q.gasto_reais desc nulls last
  limit greatest(1, least(coalesce(p_limit, 50), 500));
end;
$$;

-- ATENÇÃO — o revoke tem que ser de PUBLIC, não de anon.
-- O Postgres concede EXECUTE a PUBLIC em toda função nova, e anon
-- herda por aí: "revoke from anon" sozinho NÃO tira nada, a função
-- continua chamável por qualquer um com a chave pública do site.
-- Como ela é SECURITY DEFINER e devolve nome, e-mail e telefone de
-- toda a base, isso seria um vazamento da lista de clientes inteira.
-- O is_admin() lá dentro é a segunda trava; esta aqui é a primeira.
revoke all on function public.match_pessoas_experiencia(uuid, text, numeric, int, boolean) from public;
revoke all on function public.match_pessoas_experiencia(uuid, text, numeric, int, boolean) from anon;
grant execute on function public.match_pessoas_experiencia(uuid, text, numeric, int, boolean) to authenticated;

comment on function public.match_pessoas_experiencia is
  'Ranking de quem avisar sobre uma experiência, com motivo do match. Só admin.';


-- =====================================================================
-- 7. taste_capture_stats() — a captura está funcionando?
-- ---------------------------------------------------------------------
-- Sem isso a gente não sabe se o widget converte melhor que o
-- formulário que ninguém respondia. Compara ponto de captura por
-- ponto de captura.
-- =====================================================================

create or replace function public.taste_capture_stats(p_dias int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
  v_desde timestamptz := now() - (greatest(1, coalesce(p_dias, 30)) || ' days')::interval;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  select jsonb_build_object(
    'desde', v_desde,
    'respostas_total', (select count(*) from public.taste_responses where created_at > v_desde),
    'pessoas_com_perfil', (select count(*) from public.taste_profiles),
    'com_whatsapp', (select count(*) from public.taste_profiles where whatsapp_optin and telefone is not null),
    -- quantas compras pagas aconteceram na janela (denominador da
    -- taxa de resposta do ponto "pos_compra")
    'compras_periodo', (select count(*) from public.bookings
                         where status = 'pago' and created_at > v_desde),
    'respostas_pos_compra', (select count(distinct coalesce(booking_id::text, public.elarah_norm_email(email)))
                               from public.taste_responses
                              where origem = 'pos_compra' and created_at > v_desde),
    'por_origem', (select coalesce(jsonb_object_agg(origem, n), '{}'::jsonb)
                     from (select origem, count(*) n from public.taste_responses
                            where created_at > v_desde group by origem) s),
    'top_tags', (select coalesce(jsonb_agg(jsonb_build_object('tag', tag, 'n', n) order by n desc), '[]'::jsonb)
                   from (select t tag, count(*) n
                           from public.taste_responses r, unnest(r.tags) t
                          where r.created_at > v_desde group by t
                          order by n desc limit 15) s),
    'top_companhia', (select coalesce(jsonb_agg(jsonb_build_object('tag', c, 'n', n) order by n desc), '[]'::jsonb)
                        from (select c, count(*) n
                                from public.taste_responses r, unnest(r.companhia) c
                               where r.created_at > v_desde group by c) s),
    'top_momento', (select coalesce(jsonb_agg(jsonb_build_object('tag', momento, 'n', n) order by n desc), '[]'::jsonb)
                      from (select momento, count(*) n from public.taste_responses
                             where created_at > v_desde and momento is not null
                             group by momento) s),
    'faixa_preco', (select coalesce(jsonb_object_agg(faixa_preco, n), '{}'::jsonb)
                      from (select faixa_preco, count(*) n from public.taste_responses
                             where created_at > v_desde and faixa_preco is not null
                             group by faixa_preco) s),
    'desejos', (select coalesce(jsonb_agg(jsonb_build_object(
                          'texto', desejo, 'nome', nome, 'quando', created_at) order by created_at desc), '[]'::jsonb)
                  from (select desejo, nome, created_at from public.taste_responses
                         where desejo is not null and trim(desejo) <> ''
                         order by created_at desc limit 60) s)
  ) into v;

  return v;
end;
$$;

-- Mesmo motivo do revoke acima: PUBLIC primeiro, senão anon herda.
revoke all on function public.taste_capture_stats(int) from public;
revoke all on function public.taste_capture_stats(int) from anon;
grant execute on function public.taste_capture_stats(int) to authenticated;


notify pgrst, 'reload schema';

-- =====================================================================
-- VERIFICAÇÃO (rode depois, no mesmo SQL Editor)
--
--   -- entrou dado?
--   select origem, count(*) from public.taste_responses group by 1;
--
--   -- o gosto deduzido já existe HOJE, mesmo sem ninguém ter respondido:
--   select * from public.taste_behavior order by peso desc limit 20;
--
--   -- a base 360º
--   select email, nome, estagio, tags, compras, gasto_reais
--     from public.taste_pessoas order by engajamento desc limit 30;
--
--   -- pra quem eu mando a próxima de cerâmica?
--   select * from public.match_pessoas_experiencia(null, 'ceramica', 220, 30);
-- =====================================================================
