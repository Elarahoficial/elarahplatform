-- =========================================================
-- ELARAH — RAIO-X: o que tem em cada categoria
-- -------------------------------------------------------------
-- SÓ LEITURA. Não muda nada. Rode quantas vezes quiser.
--
-- Uma linha por categoria, com tudo que importa pra bater o olho:
--
--   categoria         → o nome como aparece
--   experiencias      → quantas experiências do site estão nela
--   parceiros_ficha   → quantas fichas de parceiro estão marcadas nela
--   quem              → os nomes das fichas (pra conferir na hora)
--   olhar             → um aviso quando alguma coisa parece torta
--
-- A coluna "olhar" é o atalho pra achar o que está estranho:
--
--   "só ficha, sem experiência" → categoria que existe só porque
--       alguém digitou na ficha. É a que polui a lista da Cotação.
--   "sem parceiro na ficha"     → tem experiência no site, mas
--       nenhuma ficha marcada; cotar por ela não traz ninguém.
--   "só 1 experiência"          → categoria magra, candidata a virar
--       parte de outra (foi o caso de "Vidro" x "Vitral").
--   "ok"                        → nada a fazer.
--
-- A comparação ignora acento, maiúscula e espaço sobrando, igual ao
-- painel. Lê a lista da ficha nos dois formatos (vírgula antiga e
-- ponto e vírgula novo).
-- =========================================================

with
site as (
  select
    trim(tok) as categoria,
    lower(regexp_replace(translate(trim(tok),
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g')) as chave
  from public.experiences e
  cross join lateral regexp_split_to_table(coalesce(e.categoria, ''), '\|') as tok
  where trim(tok) <> ''
),
ficha as (
  select
    m.fornecedor_nome,
    trim(tok) as categoria,
    lower(regexp_replace(translate(trim(tok),
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g')) as chave
  from public.fornecedores_metadata m
  cross join lateral regexp_split_to_table(
    coalesce(m.categoria, ''),
    case when m.categoria like '%;%' then ';' else ',' end
  ) as tok
  where trim(tok) <> ''
),
-- Todas as chaves que existem, venham de onde vierem.
chaves as (
  select chave from site
  union
  select chave from ficha
),
resumo as (
  select
    k.chave,
    -- Nome de exibição: prefere a grafia do site; sem site, a da ficha.
    coalesce(
      (select s.categoria from site s where s.chave = k.chave limit 1),
      (select f.categoria from ficha f where f.chave = k.chave limit 1)
    ) as categoria,
    (select count(*) from site s where s.chave = k.chave) as experiencias,
    (select count(distinct f.fornecedor_nome) from ficha f where f.chave = k.chave) as parceiros_ficha,
    (select string_agg(distinct f.fornecedor_nome, ', ')
       from ficha f where f.chave = k.chave) as quem
  from chaves k
)
select
  categoria                        as "categoria",
  experiencias                     as "experiências",
  parceiros_ficha                  as "parceiros (ficha)",
  coalesce(quem, '—')              as "quem",
  case
    when experiencias = 0                     then '⚠ só ficha, sem experiência'
    when parceiros_ficha = 0                  then '⚠ sem parceiro na ficha'
    when experiencias = 1                     then 'só 1 experiência'
    else 'ok'
  end                              as "olhar"
from resumo
order by
  -- Primeiro o que pede atenção, depois as maiores.
  case
    when experiencias = 0    then 0
    when parceiros_ficha = 0 then 1
    when experiencias = 1    then 2
    else 3
  end,
  experiencias desc,
  categoria;
