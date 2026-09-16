-- =============================================================
-- ELARAH — Passo 1: preço praticado passa a ser o VALOR CHEIO
-- -------------------------------------------------------------
-- Encerra o desconto permanente de ~10% que era aplicado em quase
-- todo o catálogo. A partir daqui o site anuncia e cobra o preço de
-- tabela, e o riscado ("de R$150 por R$135") some sozinho.
--
-- POR QUE O RISCADO SOME SEM MEXER EM CÓDIGO
-- precoCheioBR() (experiences-data.js) só devolve o "de" quando
-- valor_cheio_centavos > preço praticado. Igualando os dois, a
-- condição fica falsa e o riscado desaparece dos cards, da página de
-- detalhe e a linha "Desconto Elarah" some do checkout
-- (script.js:3817). É o mesmo mecanismo que já faz as experiências
-- By Elarah não mostrarem desconto nenhum.
--
-- ⚠️ O QUE ESTE ARQUIVO **NÃO** TOCA — por decisão explícita
--   - percentual_repasse / valor_repasse_fixo_centavos: INTACTOS
--   - comissao_type / comissao_value:                   INTACTOS
--   - valor_cheio_centavos:                             INTACTO
--   - bookings (reservas já feitas):                    INTACTAS
--
-- Nenhuma porcentagem de parceiro muda. O repasse é calculado sobre
-- valor_cheio_centavos (elarah_bookings_fornecedor_autofill.sql:107),
-- que continua igual — então o parceiro recebe exatamente o mesmo
-- valor de antes. Todo o ganho fica na margem da Elarah, que é de
-- onde o desconto saía.
--
-- IDEMPOTENTE: só atualiza onde cheio > praticado. Rodando de novo,
-- não há mais nada nessa condição e nada acontece.
--
-- REVERSÍVEL: cada linha alterada é gravada em
-- experiences_preco_cheio_log. O rollback está na seção 6.
--
-- Como rodar:
--   1) Rode ANTES sql/elarah_precos_diagnostico_valor_cheio.sql e
--      confira a lista da seção 3 (é exatamente o que vai mudar).
--   2) Supabase Dashboard → SQL Editor → cola este arquivo → Run.
-- =============================================================


-- =========================================================
-- 1. HELPERS (mesmos do diagnóstico — create or replace)
-- =========================================================
-- Replica parsePrecoToCents() de booking_guard.ts:141, o parser que
-- efetivamente cobra o cliente. Vírgula = decimal, ponto = milhar.
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

  v_text := regexp_replace(p_raw, '\s', '', 'g');
  v_text := regexp_replace(v_text, '^[Rr]\$', '');
  if v_text = '' then return null; end if;

  if position(',' in v_text) > 0 then
    v_norm := replace(replace(v_text, '.', ''), ',', '.');
  else
    v_norm := replace(v_text, '.', '');
  end if;

  if v_norm !~ '^\d+(\.\d+)?$' then return null; end if;

  v_num := v_norm::numeric;
  if v_num <= 0 then return null; end if;

  return round(v_num * 100)::integer;
end;
$$;

-- Formato com round-trip garantido nos três parsers do projeto.
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
-- 2. TABELA DE LOG — o seu rollback
-- =========================================================
create table if not exists public.experiences_preco_cheio_log (
  id                       uuid primary key default gen_random_uuid(),
  experience_id            uuid not null references public.experiences(id) on delete cascade,
  nome                     text,
  preco_anterior           text    not null,
  preco_novo               text    not null,
  praticado_anterior_centavos integer not null,
  cheio_centavos           integer not null,
  aplicado_at              timestamptz not null default now()
);

create index if not exists experiences_preco_cheio_log_exp_idx
  on public.experiences_preco_cheio_log (experience_id);
create index if not exists experiences_preco_cheio_log_at_idx
  on public.experiences_preco_cheio_log (aplicado_at desc);

alter table public.experiences_preco_cheio_log enable row level security;

drop policy if exists "experiences_preco_cheio_log_admin_all" on public.experiences_preco_cheio_log;
create policy "experiences_preco_cheio_log_admin_all"
  on public.experiences_preco_cheio_log for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- =========================================================
-- 3. A ATUALIZAÇÃO
-- =========================================================
-- Critério (todos obrigatórios):
--   - não é experiência de teste
--   - tem valor cheio cadastrado e > 0
--   - o preço atual parseia (se não parseia, está quebrada — não
--     escrevemos por cima sem você olhar)
--   - o cheio é MAIOR que o praticado (há desconto real a remover)
-- Preço acima do cheio e preço inválido ficam de fora de propósito:
-- ver seções 4b e 4c do diagnóstico.
with alvo as (
  select
    e.id,
    e.nome,
    e.preco                                                       as preco_anterior,
    public._elarah_preco_para_centavos(e.preco)                   as praticado,
    e.valor_cheio_centavos                                        as cheio,
    public._elarah_centavos_para_preco(e.valor_cheio_centavos)    as preco_novo
  from public.experiences e
  where coalesce(e.is_test, false) = false
    and e.valor_cheio_centavos is not null
    and e.valor_cheio_centavos > 0
    and public._elarah_preco_para_centavos(e.preco) is not null
    and e.valor_cheio_centavos > public._elarah_preco_para_centavos(e.preco)
),
gravado as (
  insert into public.experiences_preco_cheio_log (
    experience_id, nome, preco_anterior, preco_novo,
    praticado_anterior_centavos, cheio_centavos
  )
  select id, nome, preco_anterior, preco_novo, praticado, cheio
  from alvo
  returning experience_id, preco_novo
)
update public.experiences e
   set preco = g.preco_novo
  from gravado g
 where e.id = g.experience_id;


-- =========================================================
-- 4. CONFERÊNCIA — round-trip e sobras
-- =========================================================

-- 4a. O que acabou de mudar.
select nome, preco_anterior, preco_novo,
       round((cheio_centavos - praticado_anterior_centavos) / 100.0, 2) as aumento_reais
from public.experiences_preco_cheio_log
where aplicado_at > now() - interval '5 minutes'
order by aumento_reais desc, nome;

-- 4b. PROVA DE ROUND-TRIP — tem que devolver ZERO linhas.
--     Reparseia o texto que acabamos de gravar e compara com o cheio.
--     Qualquer linha aqui significa que o texto gravado não volta pro
--     mesmo número, ou seja, o valor cobrado sairia errado.
select e.nome, e.preco, e.valor_cheio_centavos,
       public._elarah_preco_para_centavos(e.preco) as reparseado
from public.experiences e
join public.experiences_preco_cheio_log l on l.experience_id = e.id
where public._elarah_preco_para_centavos(e.preco) is distinct from e.valor_cheio_centavos;

-- 4c. Ainda sobrou algum desconto no catálogo?
--     Estas ainda vão mostrar o riscado. O esperado é ZERO linhas
--     (fora casos de preço inválido, que o diagnóstico já listou).
select e.nome, e.preco,
       public._elarah_centavos_para_preco(e.valor_cheio_centavos) as valor_cheio
from public.experiences e
where coalesce(e.is_test,false) = false
  and e.valor_cheio_centavos > 0
  and public._elarah_preco_para_centavos(e.preco) is not null
  and e.valor_cheio_centavos > public._elarah_preco_para_centavos(e.preco)
order by e.nome;


-- =========================================================
-- 5. IMPACTO NA MARGEM
-- =========================================================
-- Quanto você deixava na mesa por vaga vendida. Usa o padrão 70/30
-- do autofill; experiências com repasse próprio terão outro número.
select
  count(*)                                                         as experiencias_ajustadas,
  round(sum(cheio_centavos - praticado_anterior_centavos)/100.0, 2) as ganho_total_por_vaga_reais,
  round(avg(cheio_centavos - praticado_anterior_centavos)/100.0, 2) as ganho_medio_por_vaga_reais,
  round(avg((cheio_centavos - praticado_anterior_centavos) * 100.0
            / nullif(praticado_anterior_centavos,0)), 1)           as aumento_medio_pct
from public.experiences_preco_cheio_log
where aplicado_at > now() - interval '5 minutes';


-- =========================================================
-- 6. ROLLBACK — se precisar voltar atrás
-- =========================================================
-- Descomente e rode. Volta cada preço exatamente como estava, usando
-- o último registro de cada experiência no log.
--
-- with ultimo as (
--   select distinct on (experience_id)
--          experience_id, preco_anterior
--     from public.experiences_preco_cheio_log
--    order by experience_id, aplicado_at desc
-- )
-- update public.experiences e
--    set preco = u.preco_anterior
--   from ultimo u
--  where e.id = u.experience_id;


-- =========================================================
-- 7. Refresh do cache do PostgREST
-- =========================================================
notify pgrst, 'reload schema';
