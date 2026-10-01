-- =============================================================
-- ELARAH — Ateliê Flor de Arte: novo endereço em mais 3 oficinas
-- -------------------------------------------------------------
-- A "Oficina de Customização de Pregadores Fofinhos" já está com o
-- endereço novo (Av. Indianópolis, 2912 - Casa Fulo). Estas oficinas
-- do mesmo ateliê mudaram para o MESMO endereço:
--   - Oficina de Guirlanda ............... 17/10
--   - Pintura na Taça de Vinho & Vela .... 17/10
--   - Aprenda a Lei da Atração ........... 21/11
--
-- O script copia endereço/bairro da experiência dos Pregadores para:
--   a) a ficha dessas 3 experiências (o que aparece no site), e
--   b) a cópia guardada em cada reserva paga (bookings.metadata),
--      que é o que o e-mail de confirmação e o lembrete de 48h leem.
-- O endereço antigo fica guardado em metadata.endereco_anterior.
--
-- Como usar (Supabase → SQL Editor):
--   1. Rode o PASSO 1 e confira: só as 3 oficinas do Flor de Arte, com
--      o endereço novo do lado direito.
--   2. Rode o PASSO 2 (atualiza a ficha das experiências).
--   3. Rode o PASSO 3 e confira a lista de reservas.
--   4. Rode o PASSO 4 (atualiza as reservas).
--   5. No painel admin → Reservas, clique "📧 Reenviar confirmação" em
--      cada reserva listada no PASSO 4.
--
-- IDEMPOTENTE — rodar de novo não muda nada.
-- =============================================================

-- PASSO 1 — conferência das experiências (não altera nada)
with novo as (
  select endereco, bairro from public.experiences
   where nome ilike '%pregadores fofinhos%' limit 1
)
select e.id, e.nome, e.fornecedor_nome,
       e.endereco as endereco_atual, e.bairro as bairro_atual,
       novo.endereco as endereco_novo, novo.bairro as bairro_novo
  from public.experiences e, novo
 where e.fornecedor_nome ilike '%flor de arte%'
   and (e.nome ilike '%guirlanda%'
        or (e.nome ilike '%ta_a%' and e.nome ilike '%vela%')
        or e.nome ilike '%lei da atra%')
 order by e.nome;

-- PASSO 2 — atualiza o endereço na ficha das experiências
with novo as (
  select endereco, bairro from public.experiences
   where nome ilike '%pregadores fofinhos%' limit 1
)
update public.experiences e
   set endereco = novo.endereco,
       bairro   = novo.bairro
  from novo
 where e.fornecedor_nome ilike '%flor de arte%'
   and (e.nome ilike '%guirlanda%'
        or (e.nome ilike '%ta_a%' and e.nome ilike '%vela%')
        or e.nome ilike '%lei da atra%')
   and (e.endereco is distinct from novo.endereco
        or e.bairro is distinct from novo.bairro)
returning e.id, e.nome, e.endereco, e.bairro;

-- PASSO 3 — conferência das reservas (não altera nada)
select b.id, b.nome, b.email, b.telefone, b.experiencia_nome, b.data,
       b.horario, b.quantidade,
       b.metadata->>'endereco' as endereco_na_reserva,
       e.endereco              as endereco_novo
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where e.fornecedor_nome ilike '%flor de arte%'
   and b.status = 'pago'
   and (   (e.nome ilike '%guirlanda%' and b.data ~ '(2026-10-17|17/10)')
        or (e.nome ilike '%ta_a%' and e.nome ilike '%vela%'
            and b.data ~ '(2026-10-17|17/10)')
        or (e.nome ilike '%lei da atra%' and b.data ~ '(2026-11-21|21/11)'))
 order by b.experiencia_nome, b.created_at;

-- PASSO 4 — atualiza o endereço nas reservas
update public.bookings b
   set metadata = coalesce(b.metadata, '{}'::jsonb) || jsonb_build_object(
         'endereco',            e.endereco,
         'bairro',              e.bairro,
         'endereco_anterior',   b.metadata->'endereco',
         'bairro_anterior',     b.metadata->'bairro',
         'endereco_alterado_em', now()
       )
  from public.experiences e
 where e.id = b.experiencia_id
   and e.fornecedor_nome ilike '%flor de arte%'
   and b.status = 'pago'
   and (   (e.nome ilike '%guirlanda%' and b.data ~ '(2026-10-17|17/10)')
        or (e.nome ilike '%ta_a%' and e.nome ilike '%vela%'
            and b.data ~ '(2026-10-17|17/10)')
        or (e.nome ilike '%lei da atra%' and b.data ~ '(2026-11-21|21/11)'))
   and (b.metadata->>'endereco' is distinct from e.endereco
        or b.metadata->>'bairro' is distinct from e.bairro)
returning b.id, b.nome, b.experiencia_nome, b.data,
          b.metadata->>'endereco' as endereco_atual;
