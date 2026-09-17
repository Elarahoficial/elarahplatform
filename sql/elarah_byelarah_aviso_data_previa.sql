-- =============================================================
-- ELARAH — PRÉVIA: quem receberia o aviso automático (só leitura)
-- -------------------------------------------------------------
-- Responde "se eu publicar a data hoje, quem recebe?" SEM enviar nada e
-- SEM alterar nada. Pode rodar antes mesmo de instalar a automação —
-- esta query não depende de nenhuma peça dela.
--
-- IMPORTANTE: a automação NUNCA dispara sozinha por tempo. Ela só reage
-- ao MOMENTO em que você salva um item cruzando um dos sinais (publicar
-- a data, tirar da lista de espera / ligar o checkout). Nada sai
-- "porque hoje é hoje".
--
-- Como rodar: Supabase Dashboard → SQL Editor → cola → Run.
-- =============================================================

select
  i.nome,
  coalesce(nullif(btrim(i.data), ''), '(vazio)')            as data_atual,
  i.tipo,
  i.ativo,
  (i.experience_id is not null)                              as checkout_ligado,
  d.publicada                                                as data_ja_publicada,
  case
    when i.ativo is not true
      then 'OCULTO — não avisaria ninguém'
    when coalesce((to_jsonb(i) ->> 'avisar_interessados')::boolean, true) is not true
      then 'AVISO DESLIGADO neste item'
    when d.publicada
      then 'JA TEM DATA — só avisaria se você REMARCAR pra outra data'
    else
      'NA ESPERA — AVISARIA ao publicar a data ou tirar da lista de espera'
  end                                                        as o_que_aconteceria,
  coalesce(p.pessoas, 0)                                     as inscricoes_na_lista,
  coalesce(p.com_telefone, 0)                                as receberiam_whatsapp
from public.byelarah_items i
cross join lateral (
  -- Mesma regra da automação: o texto livre já é uma data de verdade?
  select case
    when btrim(coalesce(i.data, '')) = '' then false
    when lower(i.data) ~ '(em breve|a definir|a combinar|a confirmar|sem data|pr[oó]xima turma|proximamente|pr[oó]ximamente|lista de espera)' then false
    when i.data ~ '\d{1,2}\s*[/-]\s*\d{1,2}' then true
    when i.data ~ '\d{1,2}'
     and lower(i.data) ~ '(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)' then true
    else false
  end as publicada
) d
left join lateral (
  -- A lista daquele item: pelo slug (preferencial) ou, pra lead antigo
  -- sem slug, pelo nome exato. "receberiam_whatsapp" conta telefones
  -- únicos com cara de número válido — é uma APROXIMAÇÃO da contagem
  -- real (a validação fina de DDD acontece na hora do envio).
  select
    count(*) as pessoas,
    count(distinct regexp_replace(s.telefone, '\D', '', 'g'))
      filter (where length(regexp_replace(s.telefone, '\D', '', 'g')) between 10 and 13)
      as com_telefone
  from public.byelarah_submissions s
  where s.item_slug = i.slug
     or (s.item_slug is null and s.experiencia = i.nome)
) p on true
order by
  i.ativo desc,
  d.publicada asc,      -- os que ainda estão na espera primeiro
  i.ordem asc;

-- =============================================================
-- Depois de instalar a automação, pra ver se há alguma onda enfileirada
-- (antes de instalar, esta query dá erro de tabela inexistente — normal):
--
--   select item_nome, data_texto, motivo, status, total_alvo, enviados,
--          created_at, processed_at
--     from byelarah_date_announcements
--    order by created_at desc;
-- =============================================================
