-- =============================================================
-- ELARAH — DIAGNÓSTICO: preço praticado × valor cheio
-- -------------------------------------------------------------
-- 100% SOMENTE LEITURA. Não altera UMA LINHA sequer.
-- Rode este arquivo ANTES de sql/elarah_precos_igualar_valor_cheio.sql
-- pra ver exatamente o que vai mudar.
--
-- CONTEXTO
-- Hoje quase toda experiência tem dois preços:
--   experiences.valor_cheio_centavos  → o preço de tabela (o "de")
--   experiences.preco (text)          → o preço praticado (o "por")
-- Quando o cheio é MAIOR que o praticado, o site mostra o riscado
-- ("de R$150 por R$135"). Ver precoCheioBR() em experiences-data.js.
--
-- A decisão é acabar com esse desconto permanente e vender pelo cheio.
-- Ou seja: preco passa a valer exatamente valor_cheio_centavos.
--
-- ⚠️ O QUE ESTE PASSO **NÃO** MUDA
--   - percentual_repasse, valor_repasse_fixo_centavos, comissao_type,
--     comissao_value: INTACTOS. Nenhuma porcentagem de parceiro muda.
--   - valor_cheio_centavos: INTACTO. Ele é a base do repasse
--     (ver elarah_bookings_fornecedor_autofill.sql), então o parceiro
--     recebe exatamente o mesmo que recebe hoje.
--   - Reservas já feitas: INTACTAS. Cada booking guarda seus próprios
--     valores no momento da compra.
-- O único efeito é que a Elarah para de abrir mão da própria margem.
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
-- =============================================================


-- =========================================================
-- 1. HELPERS — espelham os parsers do código
-- =========================================================
-- ATENÇÃO: esta função replica parsePrecoToCents() de
-- supabase/functions/_shared/booking_guard.ts (linha 141) — o parser
-- que efetivamente COBRA o cliente. Regra brasileira: vírgula é
-- decimal, ponto é milhar. Sem vírgula, todo ponto é milhar
-- ("1.320" = R$1.320, não R$1,32).
--
-- Se um dia aquele parser mudar, esta função tem que mudar junto.
create or replace function public._elarah_preco_para_centavos(p_raw text)
returns integer
language plpgsql
immutable
as $$
declare
  v_text text;
  v_norm text;
  v_num  numeric;
begin
  if p_raw is null then return null; end if;

  -- .replace(/\s/g, "").replace(/^R\$/i, "")
  v_text := regexp_replace(p_raw, '\s', '', 'g');
  v_text := regexp_replace(v_text, '^[Rr]\$', '');
  if v_text = '' then return null; end if;

  -- text.includes(",") ? remove pontos e troca vírgula por ponto
  --                    : remove pontos
  if position(',' in v_text) > 0 then
    v_norm := replace(replace(v_text, '.', ''), ',', '.');
  else
    v_norm := replace(v_text, '.', '');
  end if;

  -- Number(normalized) — só aceitamos decimal simples. Qualquer outra
  -- coisa ("Sob consulta", "A partir de 300") vira NULL, que é
  -- exatamente o que o backend faz (invalid_price / HTTP 422).
  if v_norm !~ '^\d+(\.\d+)?$' then return null; end if;

  v_num := v_norm::numeric;
  if v_num <= 0 then return null; end if;

  return round(v_num * 100)::integer;
end;
$$;

-- Centavos → texto pro campo experiences.preco.
-- O formato escolhido ("R$ 1380" / "R$ 162,90") faz o round-trip
-- correto nos TRÊS parsers do projeto:
--   booking_guard.ts parsePrecoToCents()     (cobra)
--   script.js        parsePrecoToCents()     (checkout)
--   experiences-data.js precoParaCentavos()  (decide o riscado)
-- e é reformatado pra exibição por formatPrecoBR() ("R$ 1.380").
-- Não usamos separador de milhar aqui de propósito: é o ponto que
-- historicamente causou o bug de cobrar R$1,32 por R$1.320.
create or replace function public._elarah_centavos_para_preco(p_cents integer)
returns text
language sql
immutable
as $$
  select case
    when p_cents is null or p_cents <= 0 then null
    when p_cents % 100 = 0 then 'R$ ' || (p_cents / 100)::text
    else 'R$ ' || (p_cents / 100)::text || ',' || lpad((p_cents % 100)::text, 2, '0')
  end;
$$;


-- =========================================================
-- 2. RESUMO — quantas experiências, e qual o impacto
-- =========================================================
with base as (
  select
    e.id,
    e.nome,
    e.preco                                        as preco_txt,
    public._elarah_preco_para_centavos(e.preco)    as praticado,
    e.valor_cheio_centavos                         as cheio,
    coalesce(e.is_active, true)                    as ativa
  from public.experiences e
  where coalesce(e.is_test, false) = false
)
select
  case
    when cheio is null or cheio <= 0        then 'D. Sem valor cheio cadastrado (nada a fazer aqui)'
    when praticado is null                  then 'E. Preço não numérico — JÁ QUEBRADO no checkout hoje'
    when cheio > praticado                  then 'A. VAI SUBIR pro valor cheio'
    when cheio = praticado                  then 'B. Já está igual (nada muda)'
    else                                         'C. Preço ACIMA do cheio — revisar à mão'
  end                                                            as situacao,
  count(*)                                                       as qtd,
  count(*) filter (where ativa)                                  as qtd_ativas,
  -- Só soma onde os dois lados existem. Sem isso, o grupo "preço
  -- inválido" somaria o cheio inteiro contra um praticado nulo e
  -- mostraria um ganho que não existe.
  sum(case when cheio > 0 and praticado is not null and cheio > praticado
           then cheio - praticado else 0 end)                       as ganho_por_vaga_centavos
from base
group by 1
order by 1;


-- =========================================================
-- 3. DETALHE — a lista exata do que vai subir (grupo A)
-- =========================================================
-- Confira esta lista com calma. É o que a migração vai escrever.
with base as (
  select
    e.id,
    e.nome,
    e.categoria,
    e.preco                                        as preco_txt,
    public._elarah_preco_para_centavos(e.preco)    as praticado,
    e.valor_cheio_centavos                         as cheio,
    coalesce(e.is_active, true)                    as ativa
  from public.experiences e
  where coalesce(e.is_test, false) = false
)
select
  nome,
  categoria,
  ativa,
  preco_txt                                          as preco_hoje,
  public._elarah_centavos_para_preco(cheio)          as preco_novo,
  round((cheio - praticado) / 100.0, 2)              as aumento_reais,
  round(((cheio - praticado) * 100.0) / praticado, 1) as aumento_pct,
  -- Margem Elarah por vaga assumindo o padrão 70/30 do autofill.
  -- Experiências com repasse próprio cadastrado terão outro número.
  round((praticado - cheio * 0.70) / 100.0, 2)       as margem_hoje_reais,
  round((cheio - cheio * 0.70) / 100.0, 2)           as margem_nova_reais
from base
where cheio is not null and cheio > 0
  and praticado is not null
  and cheio > praticado
order by ativa desc, aumento_pct desc, nome;


-- =========================================================
-- 4. ATENÇÃO — casos que a migração NÃO vai tocar
-- =========================================================

-- 4a. Sem valor cheio cadastrado. Não dá pra derivar o preço de
--     tabela — só você sabe qual é. Preencha "Valor cheio (R$)" no
--     admin e rode o diagnóstico de novo.
select 'SEM VALOR CHEIO' as alerta, nome, categoria, preco, coalesce(is_active,true) as ativa
from public.experiences
where coalesce(is_test,false) = false
  and (valor_cheio_centavos is null or valor_cheio_centavos <= 0)
order by ativa desc, nome;

-- 4b. Preço praticado ACIMA do cheio. Ou o cheio está desatualizado,
--     ou o preço subiu sem atualizar o cheio. Como o REPASSE sai do
--     cheio, aqui o parceiro pode estar recebendo a menos. Revisar.
select 'PREÇO ACIMA DO CHEIO' as alerta, nome, preco,
       public._elarah_centavos_para_preco(valor_cheio_centavos) as valor_cheio
from public.experiences
where coalesce(is_test,false) = false
  and valor_cheio_centavos > 0
  and public._elarah_preco_para_centavos(preco) > valor_cheio_centavos
order by nome;

-- 4c. Preço que NÃO parseia. Estas já devolvem invalid_price (HTTP 422)
--     no checkout hoje — ninguém consegue comprar. Corrigir à mão.
select 'PREÇO INVÁLIDO' as alerta, nome, preco, coalesce(is_active,true) as ativa
from public.experiences
where coalesce(is_test,false) = false
  and public._elarah_preco_para_centavos(preco) is null
order by ativa desc, nome;

-- 4d. Experiências com VARIAÇÕES com preço próprio (Individual/Dupla/
--     Trio...). O preço da variação vive em variant_items[].preco e
--     tem precedência sobre experiences.preco no checkout
--     (booking_guard.ts:662). Existe só UM valor_cheio por experiência,
--     então não há como derivar o cheio de cada variação — teria que
--     ser regra sua. A migração não mexe nelas.
select
  'TEM VARIAÇÃO COM PREÇO' as alerta,
  e.nome,
  e.preco                                             as preco_base,
  public._elarah_centavos_para_preco(e.valor_cheio_centavos) as valor_cheio,
  jsonb_array_length(e.variant_items)                 as qtd_variacoes,
  (select jsonb_agg(jsonb_build_object('nome', v->>'nome', 'preco', v->>'preco'))
     from jsonb_array_elements(e.variant_items) v
    where coalesce(v->>'preco','') <> '')             as variacoes_com_preco
from public.experiences e
where coalesce(e.is_test,false) = false
  and e.variant_items is not null
  and jsonb_typeof(e.variant_items) = 'array'
  and jsonb_array_length(e.variant_items) > 0
  and exists (
    select 1 from jsonb_array_elements(e.variant_items) v
     where coalesce(v->>'preco','') <> ''
  )
order by e.nome;
