-- =============================================================
-- ELARAH — Passo 1a: arredonda preço quebrado pra real cheio
-- -------------------------------------------------------------
-- Rode DEPOIS de sql/elarah_precos_igualar_valor_cheio.sql e ANTES de
-- sql/elarah_precos_variacoes_igualar.sql.
--
-- POR QUÊ
-- Algumas experiências têm valor_cheio_centavos quebrado (Duo Maré =
-- 17667, Mediterrâneo Bolle = 19889). O passo 1 copiou isso pro preço
-- e o catálogo ficou com "R$ 176,67" e "R$ 198,89". Preço de vitrine
-- não se anuncia assim.
--
-- REGRA: arredonda pra CIMA até o real cheio (R$176,67 → R$177).
-- Pra cima, não pro mais próximo, por dois motivos: nunca derruba a
-- margem abaixo do valor cheio, e o ajuste máximo é de R$0,99.
-- Pra mudar pra "mais próximo", troque ceil() por round() na seção 3.
--
-- ESCOPO: SÓ experiências que o passo 1 efetivamente alterou (as que
-- estão em experiences_preco_cheio_log). Preço quebrado que já existia
-- antes é escolha do parceiro e não é nosso pra mexer.
--
-- ⚠️ EFEITO COLATERAL CONSCIENTE
-- Depois disto, preço praticado fica alguns centavos ACIMA do
-- valor_cheio_centavos. Isso é esperado e inofensivo:
--   - o riscado continua sumido (precoCheioBR só mostra o "de" quando
--     cheio > praticado, e agora é o contrário);
--   - o repasse NÃO muda — continua saindo de valor_cheio_centavos,
--     que este arquivo não toca. O parceiro recebe exatamente o mesmo.
--   - esses centavos ficam na margem da Elarah.
-- Esses registros vão aparecer na seção 4b do diagnóstico ("preço
-- acima do cheio"). É esperado, não é erro.
--
-- IDEMPOTENTE e REVERSÍVEL (log + rollback na seção 5).
-- =============================================================


-- =========================================================
-- 1. Helpers (iguais aos dos outros passos)
-- =========================================================
create or replace function public._elarah_preco_para_centavos(p_raw text)
returns integer language plpgsql immutable as $$
declare v_text text; v_norm text; v_num numeric;
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
end; $$;

create or replace function public._elarah_centavos_para_preco(p_cents integer)
returns text language sql immutable as $$
  select case
    when p_cents is null or p_cents <= 0 then null
    when p_cents % 100 = 0 then 'R$ ' || (p_cents / 100)::text
    else 'R$ ' || (p_cents / 100)::text || ',' || lpad((p_cents % 100)::text, 2, '0')
  end;
$$;


-- =========================================================
-- 2. LOG / ROLLBACK
-- =========================================================
create table if not exists public.experiences_preco_arredonda_log (
  id             uuid primary key default gen_random_uuid(),
  experience_id  uuid not null references public.experiences(id) on delete cascade,
  nome           text,
  preco_anterior text not null,
  preco_novo     text not null,
  aplicado_at    timestamptz not null default now()
);
create index if not exists experiences_preco_arredonda_log_exp_idx
  on public.experiences_preco_arredonda_log (experience_id);
alter table public.experiences_preco_arredonda_log enable row level security;
drop policy if exists "experiences_preco_arredonda_log_admin_all" on public.experiences_preco_arredonda_log;
create policy "experiences_preco_arredonda_log_admin_all"
  on public.experiences_preco_arredonda_log for all
  to authenticated using (public.is_admin()) with check (public.is_admin());


-- =========================================================
-- 3. A ATUALIZAÇÃO
-- =========================================================
with alvo as (
  select
    e.id, e.nome, e.preco as preco_anterior,
    public._elarah_centavos_para_preco(
      (ceil(public._elarah_preco_para_centavos(e.preco) / 100.0) * 100)::integer
    ) as preco_novo
  from public.experiences e
  where exists (select 1 from public.experiences_preco_cheio_log l
                 where l.experience_id = e.id)
    and public._elarah_preco_para_centavos(e.preco) is not null
    and public._elarah_preco_para_centavos(e.preco) % 100 <> 0
),
gravado as (
  insert into public.experiences_preco_arredonda_log
    (experience_id, nome, preco_anterior, preco_novo)
  select id, nome, preco_anterior, preco_novo from alvo
  returning experience_id, preco_novo
)
update public.experiences e
   set preco = g.preco_novo
  from gravado g
 where e.id = g.experience_id;


-- =========================================================
-- 4. CONFERÊNCIA
-- =========================================================
select nome, preco_anterior, preco_novo
from public.experiences_preco_arredonda_log
where aplicado_at > now() - interval '5 minutes'
order by nome;

-- PROVA: nenhum preço com centavos pode ter sobrado. Espera-se ZERO.
select e.nome, e.preco
from public.experiences e
join public.experiences_preco_cheio_log l on l.experience_id = e.id
where public._elarah_preco_para_centavos(e.preco) % 100 <> 0;


-- =========================================================
-- 5. ROLLBACK
-- =========================================================
-- with ultimo as (
--   select distinct on (experience_id) experience_id, preco_anterior
--     from public.experiences_preco_arredonda_log
--    order by experience_id, aplicado_at desc
-- )
-- update public.experiences e set preco = u.preco_anterior
--   from ultimo u where e.id = u.experience_id;

notify pgrst, 'reload schema';
