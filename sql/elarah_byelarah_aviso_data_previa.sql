-- =============================================================
-- ELARAH — PRÉVIA: quem receberia o aviso automático (só leitura)
-- -------------------------------------------------------------
-- Responde "se eu abrir esse evento hoje, quem recebe?" SEM enviar nada
-- e SEM alterar nada. Pode rodar antes mesmo de instalar a automação.
--
-- Cobre as DUAS fontes da aba By Elarah:
--   * public.experiences com is_elarah_original = true  (onde os eventos
--     vivem hoje — lista de espera = cta_mode 'waitlist')
--   * public.byelarah_items                             (legado)
--
-- IMPORTANTE: a automação NUNCA dispara sozinha por tempo. Ela só reage
-- ao MOMENTO em que você salva o evento abrindo (tirando da lista de
-- espera ou publicando a data). Nada sai "porque hoje é hoje".
--
-- Como rodar: Supabase Dashboard → SQL Editor → cola → Run.
-- =============================================================

-- A regra de "isso já é uma data?" vai inline (lateral `d` lá embaixo),
-- igual à da automação, pra esta query rodar antes de instalar qualquer
-- coisa.
with eventos as (
  -- ===== Fonte 1: experiences marcadas como Elarah Original =====
  select
    'experiência'::text                                   as fonte,
    e.nome                                                as nome,
    e.data                                                as data_texto,
    e.event_at                                            as data_real,
    (coalesce(e.cta_mode, 'buy') = 'waitlist')            as na_lista_de_espera,
    coalesce(e.is_active, true)                           as no_ar,
    null::text                                            as slug
  from public.experiences e
  where e.is_elarah_original is true

  union all

  -- ===== Fonte 2: byelarah_items (legado) =====
  select
    'item legado'::text,
    i.nome,
    i.data,
    null::timestamptz,
    (coalesce(i.tipo, 'espera') = 'espera' and i.experience_id is null),
    coalesce(i.ativo, true),
    i.slug
  from public.byelarah_items i
)
select
  ev.fonte,
  ev.nome,
  coalesce(nullif(btrim(ev.data_texto), ''), '(vazio)')    as data_atual,
  ev.na_lista_de_espera,
  ev.no_ar,
  d.publicada                                              as data_ja_publicada,
  case
    when not ev.no_ar
      then 'OCULTO — não avisaria ninguém'
    when ev.na_lista_de_espera
      then 'NA ESPERA — AVISARIA ao abrir (tirar da espera ou publicar a data)'
    when d.publicada or ev.data_real is not null
      then 'JA ABERTO com data — só avisaria se você REMARCAR'
    else
      'JA ABERTO sem data — não avisaria de novo'
  end                                                      as o_que_aconteceria,
  coalesce(p.pessoas, 0)                                   as inscricoes_na_lista,
  coalesce(p.com_telefone, 0)                              as receberiam_whatsapp
from eventos ev
cross join lateral (
  select case
    when btrim(coalesce(ev.data_texto, '')) = '' then false
    when lower(ev.data_texto) ~ '(em breve|a definir|a combinar|a confirmar|sem data|pr[oó]xima turma|proximamente|pr[oó]ximamente|lista de espera)' then false
    when ev.data_texto ~ '\d{1,2}\s*[/-]\s*\d{1,2}' then true
    when ev.data_texto ~ '\d{1,2}'
     and lower(ev.data_texto) ~ '(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)' then true
    else false
  end as publicada
) d
left join lateral (
  -- A lista daquele evento: pelo nome EXATO (é assim que o formulário da
  -- home grava) ou pelo slug do item legado, quando existe.
  -- "receberiam_whatsapp" conta telefones únicos com cara de número
  -- válido — APROXIMAÇÃO (a validação fina de DDD é na hora do envio).
  select
    count(*) as pessoas,
    count(distinct regexp_replace(s.telefone, '\D', '', 'g'))
      filter (where length(regexp_replace(s.telefone, '\D', '', 'g')) between 10 and 13)
      as com_telefone
  from public.byelarah_submissions s
  where s.experiencia = ev.nome
     or (ev.slug is not null and s.item_slug = ev.slug)
) p on true
order by
  ev.no_ar desc,
  ev.na_lista_de_espera desc,   -- os que ainda estão na espera primeiro
  coalesce(p.pessoas, 0) desc,
  ev.nome asc;

-- =============================================================
-- Se vier VAZIO: não há nenhuma experiência marcada como "Elarah
-- Original" nem item legado cadastrado. Confira na aba By Elarah do
-- admin se os eventos estão marcados como Original.
--
-- Pra ver a lista de interesse crua (quem se inscreveu em quê):
--   select experiencia, item_slug, count(*) as inscricoes,
--          max(created_at) as ultima
--     from byelarah_submissions
--    group by experiencia, item_slug
--    order by inscricoes desc;
-- =============================================================
