-- =============================================================
-- ELARAH — Passo 1b: variações acompanham o valor cheio
-- -------------------------------------------------------------
-- COMPLEMENTO OBRIGATÓRIO de sql/elarah_precos_igualar_valor_cheio.sql.
-- ORDEM: passo 1 (igualar) → passo 1a (arredondar) → este.
-- Sozinho não faz nada: depende do experiences_preco_cheio_log.
-- A variação recebe o preço BASE ATUAL, então já herda o
-- arredondamento pra real cheio feito no passo 1a.
--
-- O PROBLEMA QUE ESTE ARQUIVO RESOLVE
-- O passo 1 subiu experiences.preco para o valor cheio, mas o preço
-- de uma variação vive em variant_items[].preco e tem PRECEDÊNCIA
-- sobre o preço base no checkout (booking_guard.ts:662). Resultado:
-- quem escolhe uma variação continuava pagando o preço antigo, com
-- desconto. Em "Modelagem ou Pintura em Cerâmica" as DUAS opções são
-- variação — ou seja, o aumento não valia para ninguém, e o site
-- passou a anunciar R$275 cobrando R$248.
--
-- A REGRA (conservadora de propósito)
-- Só sobe a variação cujo preço era EXATAMENTE o preço base antigo —
-- isto é, a variação que representa a mesma unidade do base
-- ("Individual", "1 Aula", "Modelagem", "Duo Maré Azul"). Essas
-- carregavam o mesmo desconto que acabamos de tirar do base.
--
-- NÃO TOCA em nada que tenha preço próprio diferente do base antigo:
--   - pacotes de volume  ("4 Aulas" R$663 para um base de R$195 —
--     desconto de escala do parceiro, legítimo, não é o nosso 10%)
--   - opções de grupo    ("Dupla", "Trio", "Quarteto")
--   - tamanhos/produtos  ("45x45cm", "Colar Personalizado")
-- Tudo isso sai na lista de revisão manual da seção 4.
--
-- A fonte da verdade do "preço base antigo" é
-- experiences_preco_cheio_log, gravado pelo passo 1. Por isso este
-- arquivo só age sobre experiências que o passo 1 efetivamente mudou.
--
-- NÃO MUDA NADA DE PARCEIRO: percentual_repasse, comissao_* e
-- valor_cheio_centavos seguem intactos, como no passo 1.
--
-- IDEMPOTENTE: na segunda execução nenhuma variação ainda bate com o
-- preço antigo, então nada acontece.
-- REVERSÍVEL: o variant_items inteiro é salvo antes, em
-- experiences_variant_preco_log. Rollback na seção 5.
-- =============================================================


-- =========================================================
-- 1. LOG / ROLLBACK
-- =========================================================
create table if not exists public.experiences_variant_preco_log (
  id                  uuid primary key default gen_random_uuid(),
  experience_id       uuid not null references public.experiences(id) on delete cascade,
  nome                text,
  variant_items_antes jsonb not null,
  variant_items_depois jsonb not null,
  base_antigo_centavos integer not null,
  base_novo_centavos   integer not null,
  aplicado_at         timestamptz not null default now()
);

create index if not exists experiences_variant_preco_log_exp_idx
  on public.experiences_variant_preco_log (experience_id);

alter table public.experiences_variant_preco_log enable row level security;
drop policy if exists "experiences_variant_preco_log_admin_all" on public.experiences_variant_preco_log;
create policy "experiences_variant_preco_log_admin_all"
  on public.experiences_variant_preco_log for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- =========================================================
-- 2. A ATUALIZAÇÃO
-- =========================================================
with base_log as (
  -- Último registro de cada experiência no log do passo 1.
  select distinct on (experience_id)
         experience_id,
         praticado_anterior_centavos as base_antigo,
         cheio_centavos              as base_novo
    from public.experiences_preco_cheio_log
   order by experience_id, aplicado_at desc
),
alvo as (
  select
    e.id, e.nome, e.variant_items as antes,
    l.base_antigo,
    -- DESTINO = o preço base ATUAL da experiência, não o cheio bruto do
    -- log. Assim a variação herda qualquer ajuste posterior ao passo 1 —
    -- em especial o arredondamento pra real cheio do passo 1a (Duo Maré
    -- vira R$ 177, não R$ 176,67). Se o arredondamento não tiver rodado,
    -- o preço atual É o cheio e o resultado é idêntico.
    public._elarah_preco_para_centavos(e.preco)      as base_novo,
    -- Reconstrói o array preservando ordem e todas as outras chaves
    -- (nome, imagem...). Só o campo "preco" é reescrito, e só quando
    -- o valor parseado bate exatamente com o base antigo.
    (
      select jsonb_agg(
               case
                 when public._elarah_preco_para_centavos(v->>'preco') = l.base_antigo
                 then jsonb_set(v, '{preco}', to_jsonb(e.preco))
                 else v
               end
               order by ord
             )
        from jsonb_array_elements(e.variant_items) with ordinality as t(v, ord)
    ) as depois
  from public.experiences e
  join base_log l on l.experience_id = e.id
  where public._elarah_preco_para_centavos(e.preco) is not null
    and e.variant_items is not null
    and jsonb_typeof(e.variant_items) = 'array'
    and jsonb_array_length(e.variant_items) > 0
    and exists (
      select 1 from jsonb_array_elements(e.variant_items) v
       where public._elarah_preco_para_centavos(v->>'preco') = l.base_antigo
    )
),
gravado as (
  insert into public.experiences_variant_preco_log
    (experience_id, nome, variant_items_antes, variant_items_depois,
     base_antigo_centavos, base_novo_centavos)
  select id, nome, antes, depois, base_antigo, base_novo from alvo
  returning experience_id, variant_items_depois
)
update public.experiences e
   set variant_items = g.variant_items_depois
  from gravado g
 where e.id = g.experience_id;


-- =========================================================
-- 3. CONFERÊNCIA
-- =========================================================

-- 3a. O que mudou, variação por variação.
select l.nome,
       a.v->>'nome'                                as variacao,
       a.v->>'preco'                               as preco_antes,
       d.v->>'preco'                               as preco_depois
from public.experiences_variant_preco_log l
cross join lateral jsonb_array_elements(l.variant_items_antes)  with ordinality as a(v, ord)
join      lateral jsonb_array_elements(l.variant_items_depois) with ordinality as d(v, ord)
  on d.ord = a.ord
where l.aplicado_at > now() - interval '5 minutes'
  and (a.v->>'preco') is distinct from (d.v->>'preco')
order by l.nome, a.ord;

-- 3b. PROVA: nenhuma variação pode ter ficado abaixo do valor cheio
--     por causa do desconto que acabamos de remover. Espera-se ZERO.
select e.nome, v->>'nome' as variacao, v->>'preco' as preco,
       l.base_antigo_centavos
from public.experiences e
join public.experiences_variant_preco_log l on l.experience_id = e.id
cross join lateral jsonb_array_elements(e.variant_items) v
where public._elarah_preco_para_centavos(v->>'preco') = l.base_antigo_centavos;


-- =========================================================
-- 4. REVISÃO MANUAL — variações abaixo do preço base
-- =========================================================
-- Estas NÃO foram tocadas porque o preço não batia com o base antigo.
-- Podem ser legítimas (pacote de volume, opção de grupo) ou podem ser
-- desconto esquecido. Olhe uma a uma.
--
-- "desconto_vs_base_pct" compara o preço da variação com o preço base
-- ATUAL. Num pacote de N unidades o número vai parecer enorme e é
-- normal — o que importa é o preço por unidade.
select
  e.nome,
  e.preco                                        as base_atual,
  v->>'nome'                                     as variacao,
  v->>'preco'                                    as preco_variacao,
  round(
    (public._elarah_preco_para_centavos(e.preco)
     - public._elarah_preco_para_centavos(v->>'preco')) * 100.0
    / nullif(public._elarah_preco_para_centavos(e.preco), 0), 1)  as abaixo_do_base_pct
from public.experiences e
cross join lateral jsonb_array_elements(e.variant_items) v
where coalesce(e.is_test,false) = false
  and e.variant_items is not null
  and jsonb_typeof(e.variant_items) = 'array'
  and public._elarah_preco_para_centavos(v->>'preco') is not null
  and public._elarah_preco_para_centavos(e.preco) is not null
  and public._elarah_preco_para_centavos(v->>'preco')
      < public._elarah_preco_para_centavos(e.preco)
order by abaixo_do_base_pct desc, e.nome;

-- 4b. Experiências SEM valor cheio que têm variação com preço.
--     O passo 1 não pôde tocar nelas. Preencha "Valor cheio (R$)" no
--     admin e rode os dois passos de novo.
--     Atenção especial a quando TODAS as variações custam mais que o
--     base: aí o preço base é fantasma, ninguém compra por ele.
select e.nome, e.preco as base_atual,
       (select jsonb_agg(jsonb_build_object('nome', v->>'nome', 'preco', v->>'preco'))
          from jsonb_array_elements(e.variant_items) v) as variacoes
from public.experiences e
where coalesce(e.is_test,false) = false
  and (e.valor_cheio_centavos is null or e.valor_cheio_centavos <= 0)
  and e.variant_items is not null
  and jsonb_typeof(e.variant_items) = 'array'
  and jsonb_array_length(e.variant_items) > 0
order by e.nome;


-- =========================================================
-- 5. ROLLBACK
-- =========================================================
-- with ultimo as (
--   select distinct on (experience_id) experience_id, variant_items_antes
--     from public.experiences_variant_preco_log
--    order by experience_id, aplicado_at desc
-- )
-- update public.experiences e
--    set variant_items = u.variant_items_antes
--   from ultimo u
--  where e.id = u.experience_id;

notify pgrst, 'reload schema';
