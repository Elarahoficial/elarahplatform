-- =========================================================
-- ELARAH — DIAGNÓSTICO: categorias divergentes
-- -------------------------------------------------------------
-- SÓ LEITURA. Este arquivo não altera nada: são quatro SELECTs.
-- Pode rodar à vontade, quantas vezes quiser.
--
-- POR QUE ELE EXISTE
-- A aba Cotação monta a lista de categorias juntando DUAS fontes:
--
--   (A) a categoria das EXPERIÊNCIAS — o que a cliente vê navegando
--       o site. Uma experiência em "Cerâmica | Pintura" conta nas
--       duas categorias.
--   (B) a categoria digitada à mão na FICHA de cada parceiro
--       (aba Parceiros → fornecedores_metadata.categoria).
--
-- Quando as duas não batem, a lista incha com grafia que não leva a
-- lugar nenhum: "Beadazzeld" numa ficha e "Beadazzled" no site.
-- As consultas abaixo mostram exatamente onde isso acontece.
--
-- A comparação ignora acento, maiúscula e espaço sobrando — igualzinho
-- ao painel. Não depende da extensão unaccent.
-- =========================================================


-- =========================================================
-- 1) O QUE ESTÁ DIVERGENTE
-- Categorias que existem em ficha de parceiro e em NENHUMA
-- experiência do site. É a lista do "qual está errado".
-- Vazio aqui = está tudo unificado.
-- =========================================================
with site as (
  select distinct
    lower(regexp_replace(translate(trim(tok),
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g')) as chave,
    trim(tok) as categoria
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
  -- A ficha guarda várias categorias numa string só. O separador
  -- histórico é a vírgula; o painel novo grava com ponto e vírgula.
  -- Aqui lemos os dois formatos, igual ao painel.
  cross join lateral regexp_split_to_table(
    coalesce(m.categoria, ''),
    case when m.categoria like '%;%' then ';' else ',' end
  ) as tok
  where trim(tok) <> ''
)
select
  -- Agrupa pela mesma chave que o painel usa: "Beadazzeld" e
  -- "beadazzeld" são a MESMA divergência, e se resolvem de uma vez.
  string_agg(distinct f.categoria, ' / ')                  as "na ficha está",
  count(distinct f.fornecedor_nome)                        as "fichas",
  string_agg(distinct f.fornecedor_nome, ', ')             as "de quem",
  coalesce((
    -- Palpite de para onde ela deveria ir: categoria do site que
    -- começa com as mesmas 4 letras. É só sugestão — confira.
    select s.categoria from site s
     where left(s.chave, 4) = left(f.chave, 4)
     order by s.categoria
     limit 1
  ), '—')                                                  as "parece ser (palpite)"
from ficha f
where not exists (select 1 from site s where s.chave = f.chave)
group by f.chave
order by 2 desc, 1;


-- =========================================================
-- 2) O CASO DA VÍRGULA (não é erro de digitação seu)
-- A categoria "Casa, Arte & Design" TEM vírgula no nome. Como a
-- ficha separa por vírgula, ela era lida como DUAS categorias
-- falsas ("Casa" e "Arte & Design"). Esta consulta mostra as
-- fichas em que a string INTEIRA bate com uma categoria do site —
-- ou seja, estava certa e só foi partida ao meio na leitura.
-- =========================================================
with site as (
  select distinct
    lower(regexp_replace(translate(trim(tok),
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g')) as chave,
    trim(tok) as categoria
  from public.experiences e
  cross join lateral regexp_split_to_table(coalesce(e.categoria, ''), '\|') as tok
  where trim(tok) <> ''
)
select
  m.fornecedor_nome        as "parceiro",
  m.categoria              as "string inteira da ficha",
  s.categoria              as "bate com a categoria do site"
from public.fornecedores_metadata m
join site s
  on s.chave = lower(regexp_replace(translate(trim(m.categoria),
       'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
       'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g'))
where m.categoria like '%,%'
  and m.categoria not like '%;%'
order by 1;


-- =========================================================
-- 3) AS CATEGORIAS DO SITE (a régua)
-- O que existe de verdade no catálogo, com quantas experiências.
-- É contra esta lista que a ficha do parceiro deveria bater.
-- =========================================================
with site as (
  select
    trim(tok) as categoria,
    lower(regexp_replace(translate(trim(tok),
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '\s+', ' ', 'g')) as chave
  from public.experiences e
  cross join lateral regexp_split_to_table(coalesce(e.categoria, ''), '\|') as tok
  where trim(tok) <> ''
)
select
  min(categoria)  as "categoria do site",
  count(*)        as "experiências"
from site
group by chave
order by 2 desc, 1;


-- =========================================================
-- 4) FICHAS SEM CATEGORIA
-- Parceiro cadastrado sem categoria nenhuma na ficha: não aparece
-- em cotação por categoria, mesmo tendo experiência no site.
-- =========================================================
select
  m.fornecedor_nome as "parceiro sem categoria na ficha"
from public.fornecedores_metadata m
where coalesce(trim(m.categoria), '') = ''
order by 1;
