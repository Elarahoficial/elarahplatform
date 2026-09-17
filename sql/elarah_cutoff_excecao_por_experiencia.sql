-- =============================================================
-- ELARAH — cutoff_hours vira exceção opcional por experiência
-- -------------------------------------------------------------
-- ANTES: cutoff_hours era `not null default 24`, e o código fazia
-- Math.max(cutoff, 48) pra Gastronomia. Resultado: não dava pra
-- distinguir "não configurei" de "quero 24h mesmo", e baixar o
-- campo numa Gastronomia não surtia efeito nenhum — só dava pra
-- aumentar. Uma turma de Gastronomia sumia do site 48h antes sem
-- nenhuma forma de trazer de volta pelo painel.
--
-- DEPOIS:
--   * cutoff_hours NULL  → usa o padrão da categoria
--                          (Gastronomia 48h, demais 24h)
--   * cutoff_hours = N   → exceção desta experiência, vale N mesmo
--                          que seja menor que o padrão
--
-- A migração abaixo NÃO muda o comportamento de nenhuma
-- experiência existente: ela só apaga os valores que hoje não
-- fazem diferença, transformando-os no "padrão da categoria".
--
-- Idempotente. Rode no SQL Editor do Supabase ANTES (ou junto) do
-- deploy do código novo.
-- =============================================================

-- 1) Permite NULL ("sem exceção").
alter table public.experiences
  alter column cutoff_hours drop not null;

-- 2) Tira o default 24 — linha nova nasce sem exceção.
alter table public.experiences
  alter column cutoff_hours drop default;

-- 3) Apaga os valores que hoje já são equivalentes ao padrão da
--    categoria. Nenhuma experiência muda de comportamento:
--      * não-Gastronomia com 24  → 24 continua sendo o efetivo
--      * Gastronomia com <= 48   → o efetivo já era 48 (Math.max)
update public.experiences
   set cutoff_hours = null
 where cutoff_hours is not null
   and (
        (lower(trim(coalesce(categoria, ''))) <> 'gastronomia' and cutoff_hours = 24)
     or (lower(trim(coalesce(categoria, ''))) =  'gastronomia' and cutoff_hours <= 48)
   );

comment on column public.experiences.cutoff_hours is
  'Horas antes do evento em que a venda encerra. NULL = padrão da categoria (Gastronomia 48h, demais 24h). Um número é exceção SÓ desta experiência e vale mesmo se for menor que o padrão. Lido por effectiveCutoffHours() em experiences-data.js (site) e em supabase/functions/_shared/booking_guard.ts (checkout) — as duas precisam concordar.';

-- 4) Confere o que sobrou como exceção explícita (esperado: só o
--    que você configurar de propósito daqui pra frente).
select id, nome, categoria, data, horario, cutoff_hours
  from public.experiences
 where cutoff_hours is not null
 order by categoria, nome;

-- =============================================================
-- PRA TRAZER A "HARMONIZAÇÃO DE QUEIJOS" DE VOLTA
-- -------------------------------------------------------------
-- Pelo painel (recomendado): Editar → "Bloqueio antes do evento
-- (horas)" → 12 → Salvar.
--
-- Ou direto aqui, se preferir:
--
--   update public.experiences
--      set cutoff_hours = 12
--    where nome ilike '%Harmoniza%Queijo%'
--      and is_active = true;
--
-- 12h com a experiência às 19h30 significa: fica no ar até as
-- 07h30 do dia dela. Ajuste o número se quiser outra janela.
-- =============================================================
