-- =============================================================
-- ELARAH — "Crie seu Folding Book" 03/10 (09h00–13h00): novo endereço
-- -------------------------------------------------------------
-- O endereço da experiência já foi alterado no site (tabela
-- experiences), mas cada reserva guarda uma CÓPIA do endereço em
-- bookings.metadata.endereco / metadata.bairro, gravada no momento da
-- compra. O e-mail de confirmação (inclusive o "📧 Reenviar
-- confirmação" do painel) lê dessa cópia, então as reservas já feitas
-- continuam com o endereço antigo até este script rodar.
--
-- O script copia o endereço/bairro ATUAIS da experiência para as
-- reservas dessa data e guarda o endereço antigo em
-- metadata.endereco_anterior / bairro_anterior (auditoria).
--
-- Como usar (Supabase → SQL Editor):
--   1. Rode o PASSO 1 e confira a lista (nomes, data, endereço novo).
--   2. Rode o PASSO 2 (update).
--   3. No painel admin → Reservas, clique "📧 Reenviar confirmação" em
--      cada reserva listada: o e-mail já sai com o endereço novo.
--
-- IDEMPOTENTE — rodar de novo não muda nada (só atualiza quem ainda
-- está com endereço diferente do da experiência).
-- Vendas manuais (manual_sales) não precisam deste script: o e-mail
-- delas já lê o endereço direto da experiência.
-- =============================================================

-- PASSO 1 — conferência (não altera nada)
select b.id, b.nome, b.email, b.data, b.horario, b.status, b.quantidade,
       b.metadata->>'endereco' as endereco_na_reserva,
       e.endereco              as endereco_novo,
       e.bairro                as bairro_novo
  from public.bookings b
  join public.experiences e on e.id = b.experiencia_id
 where e.nome ilike '%folding book%'
   and b.data ~ '(2026-10-03|03/10)'
   and b.status = 'pago'
 order by b.created_at;

-- PASSO 2 — atualiza o endereço nas reservas
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
   and e.nome ilike '%folding book%'
   and b.data ~ '(2026-10-03|03/10)'
   and b.status = 'pago'
   and (b.metadata->>'endereco' is distinct from e.endereco
        or b.metadata->>'bairro' is distinct from e.bairro)
returning b.id, b.nome, b.email, b.metadata->>'endereco' as endereco_atual;
