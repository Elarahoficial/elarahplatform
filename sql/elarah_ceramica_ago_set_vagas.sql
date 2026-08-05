-- =============================================================
-- ELARAH — Ajuste de vagas ago/set (Modelagem manual / Pintura)
-- -------------------------------------------------------------
-- Aplica as vagas por data que você passou. RODE DEPOIS da
-- reconciliação (elarah_recurrence_reconcile.sql), pra não editar
-- vaga de um slot que ia sair do site.
--
-- ⚠️ "min 2" / "min 4" (mínimo de participantes pra turma
--    acontecer) NÃO É SUPORTADO hoje — não existe esse campo no
--    banco. Aqui só ajusto vagas_total. Se você quer que a turma
--    só confirme com N inscritos, isso é uma FEATURE nova (me
--    avisa que eu construo: campo min_participantes no slot +
--    aviso no checkout + regra de cancelamento/realocação).
--
-- "0 vagas" = data fechada (sai do site): uso vagas_total = 0.
-- =============================================================


-- -------------------------------------------------------------
-- PASSO 1 — descubra o experience_id certo. Rode e confirme o nome.
-- (pode haver mais de uma experiência de cerâmica/pintura; escolha
--  a que recebe estas turmas de seg-a-sex/sáb/dom.)
-- -------------------------------------------------------------
select id, nome from public.experiences
where nome ilike '%modelagem%' or nome ilike '%cerâmic%'
   or nome ilike '%ceramic%'  or nome ilike '%pintura%'
order by nome;

-- -------------------------------------------------------------
-- PASSO 2 — veja os slots exatos das datas-alvo ANTES de mudar.
-- Troque :EXP pelo id do passo 1 (com aspas). Confira se cada
-- data/horário abaixo existe (a reconciliação já deve ter deixado
-- só os que casam com a regra).
-- -------------------------------------------------------------
-- select to_char(event_at at time zone 'America/Sao_Paulo','Dy DD/MM HH24:MI') quando,
--        horario, vagas_total, vagas_restantes, is_active, id
--   from public.experience_slots
--  where experience_id = :EXP
--    and event_at::date in (date '2026-08-03', date '2026-08-08',
--                           date '2026-08-09', date '2026-08-11',
--                           date '2026-08-12', date '2026-08-14')
--  order by event_at;

-- -------------------------------------------------------------
-- PASSO 3 — aplica as vagas. Chave = (experience_id, data, horario),
-- que é a unique key do slot. Ajuste o rótulo de 'horario' se no seu
-- banco estiver com outra grafia (ex.: "10h00 – 12h00" vs "10h-12h")
-- — o passo 2 mostra a grafia real. Descomente e rode.
-- -------------------------------------------------------------
-- do $$
-- declare v_exp uuid := :EXP;   -- <<< troque pelo id (com aspas simples)
-- begin
--   -- Seg 03/08 · 19h30–21h30 → 2 vagas
--   update public.experience_slots set vagas_total = 2
--    where experience_id = v_exp and data = '03/08' and horario ilike '19h30%';
--   -- Sáb 08/08 · 10h00–12h00 → 2 vagas
--   update public.experience_slots set vagas_total = 2
--    where experience_id = v_exp and data = '08/08' and horario ilike '10h%';
--   -- Dom 09/08 · 11h00–13h00 → 6 vagas   (min 2 = NÃO suportado)
--   update public.experience_slots set vagas_total = 6
--    where experience_id = v_exp and data = '09/08' and horario ilike '11h%';
--   -- Dom 09/08 · 15h30–17h30 → 6 vagas   (min 4 = NÃO suportado)
--   update public.experience_slots set vagas_total = 6
--    where experience_id = v_exp and data = '09/08' and horario ilike '15h30%';
--   -- Ter 11/08 · 19h30–21h30 → 2 vagas
--   update public.experience_slots set vagas_total = 2
--    where experience_id = v_exp and data = '11/08' and horario ilike '19h30%';
--   -- Qua 12/08 · 19h30–21h30 → 0 vagas (fecha a data)
--   update public.experience_slots set vagas_total = 0
--    where experience_id = v_exp and data = '12/08' and horario ilike '19h30%';
--   -- Sex 14/08 · 10h00–12h00 → 0 vagas (fecha a data)
--   update public.experience_slots set vagas_total = 0
--    where experience_id = v_exp and data = '14/08' and horario ilike '10h%';
-- end $$;

-- -------------------------------------------------------------
-- PASSO 4 — confira o resultado (repita o SELECT do passo 2).
-- vagas_restantes é recalculado pelo trigger sync_slot_vagas_restantes.
-- =============================================================
