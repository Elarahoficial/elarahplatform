-- =============================================================
-- ELARAH — Excluir de vez a categoria Tufting
-- -------------------------------------------------------------
-- Categoria descontinuada: apaga as experiências de Tufting e tudo
-- que está pendurado nelas (turmas/horários e regras de recorrência
-- semanal, que saem por CASCADE).
--
-- ⚠️ PRÉ-REQUISITO
--   Rode ANTES, uma vez, o arquivo:
--     sql/elarah_experience_delete_cascade_fix.sql
--   Sem ele, a trava de integridade da recorrência barra a exclusão
--   (é exatamente o motivo do botão "Excluir" do admin não funcionar
--   nessas experiências).
--
-- ✅ O QUE **NÃO** SE PERDE
--   As reservas continuam no banco: bookings.experiencia_id e
--   bookings.slot_id são ON DELETE SET NULL e o nome da experiência
--   fica guardado em texto (bookings.experiencia_nome). Vendas,
--   valores e contabilidade seguem batendo.
--   O que se perde é o vínculo das reservas antigas com a ficha da
--   experiência — relatórios que quebram por ficha deixam de
--   enxergar essas reservas como "Tufting".
--
-- COMO RODAR (SQL Editor do Supabase)
--   PARTE 1 → confere o que vai sair. Rode e leia o resultado.
--   PARTE 2 → apaga. Rode só depois de conferir a PARTE 1.
-- =============================================================


-- =============================================================
-- PARTE 1 — CONFERÊNCIA (não apaga nada)
-- =============================================================

-- 1a. Experiências 100% Tufting → estas SÃO apagadas na PARTE 2.
select
  e.id,
  e.nome,
  e.categoria,
  e.is_active,
  (select count(*) from public.experience_slots s
    where s.experience_id = e.id)                        as turmas,
  (select count(*) from public.experience_recurrence_rules r
    where r.experience_id = e.id)                        as regras_recorrencia,
  (select count(*) from public.bookings b
    where b.experiencia_id = e.id)                       as reservas_no_historico,
  (select count(*) from public.bookings b
    where b.experiencia_id = e.id
      and b.status in ('pending', 'pago'))               as reservas_ativas_ou_pagas
from public.experiences e
where lower(trim(e.categoria)) = 'tufting'
order by e.nome;

-- 1b. Experiências em que Tufting é UMA das categorias (ex.:
--     "Tufting|Macramê"). Estas NÃO são apagadas — apagar tiraria do
--     site algo que ainda vive na outra categoria. Se aparecer alguma
--     aqui, use o bloco opcional no fim do arquivo.
select e.id, e.nome, e.categoria, e.is_active
from public.experiences e
where e.categoria ~* '(^|\|)\s*tufting\s*($|\|)'
  and lower(trim(e.categoria)) <> 'tufting'
order by e.nome;

-- 1c. Reservas ainda em aberto (pending/pago) de Tufting. Se vier
--     alguma com data futura, atenda ou cancele a cliente ANTES de
--     apagar — depois a reserva fica sem ficha pra abrir no painel.
select b.id, b.nome, b.email, b.experiencia_nome, b.data, b.horario, b.status
from public.bookings b
join public.experiences e on e.id = b.experiencia_id
where lower(trim(e.categoria)) = 'tufting'
  and b.status in ('pending', 'pago')
order by b.created_at desc;


-- =============================================================
-- PARTE 2 — EXCLUSÃO
-- -------------------------------------------------------------
-- Rode este bloco inteiro (do begin ao commit). Ele imprime quantas
-- linhas saíram em cada tabela antes de confirmar.
-- =============================================================

begin;

do $$
declare
  v_exps  integer;
  v_slots integer;
  v_regras integer;
begin
  select count(*) into v_exps
    from public.experiences
   where lower(trim(categoria)) = 'tufting';

  select count(*) into v_slots
    from public.experience_slots s
    join public.experiences e on e.id = s.experience_id
   where lower(trim(e.categoria)) = 'tufting';

  select count(*) into v_regras
    from public.experience_recurrence_rules r
    join public.experiences e on e.id = r.experience_id
   where lower(trim(e.categoria)) = 'tufting';

  raise notice '[tufting] vão sair: % experiência(s), % turma(s), % regra(s) de recorrência',
    v_exps, v_slots, v_regras;
end $$;

-- As turmas (experience_slots) e as regras de recorrência
-- (experience_recurrence_rules) saem junto por ON DELETE CASCADE.
delete from public.experiences
 where lower(trim(categoria)) = 'tufting';

commit;


-- =============================================================
-- PARTE 3 — CONFERÊNCIA FINAL
-- =============================================================
-- Esperado: 0 linhas.
select id, nome, categoria
  from public.experiences
 where categoria ~* '(^|\|)\s*tufting\s*($|\|)';


-- =============================================================
-- OPCIONAL — só se a consulta 1b devolveu alguma linha
-- -------------------------------------------------------------
-- Tira "Tufting" da lista de categorias sem apagar a experiência,
-- que continua viva nas outras categorias dela.
-- Descomente pra usar:
--
-- update public.experiences
--    set categoria = trim(both '|' from
--          regexp_replace(categoria, '(^|\|)\s*[Tt]ufting\s*(?=$|\|)', '', 'g'))
--  where categoria ~* '(^|\|)\s*tufting\s*($|\|)'
--    and lower(trim(categoria)) <> 'tufting';
