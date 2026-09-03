-- =============================================================
-- ELARAH — "Crie seu Folding Book" (05/09): troca de local
--          SOMENTE pra quem já comprou
-- -------------------------------------------------------------
-- O local do evento mudou na semana da experiência. A experiência
-- não está mais à venda, então NÃO se mexe em public.experiences:
-- a página pública não precisa mudar e a alteração ali não teria
-- destinatário. O que precisa mudar é o que aparece pra quem já
-- comprou — aba "Minhas compras" e e-mail de confirmação.
--
-- Endereço novo:
--   Rua Oscar Freire, 1128 — Cerqueira César (Jardins)
--
-- ONDE ISSO APARECE
--   * bookings.metadata->>'endereco' / 'bairro' é o que conta.js
--     mostra no card quando a reserva tem endereco_alterado_em
--     (override explícito vence o endereço da experiência), e é o
--     que resend-booking-confirmation e automated-notifications
--     mandam por e-mail/WhatsApp.
--   * endereco_anterior/bairro_anterior fazem o card mostrar
--     "Novo local: ..." com o endereço antigo riscado. Sem eles a
--     tela trocaria o endereço em silêncio — que é justamente o
--     jeito de a cliente ir pro lugar errado no dia.
--
-- COMO RODAR
--   Cole tudo no SQL Editor do Supabase e clique Run.
--
-- SEGURANÇA
--   * Transação única: qualquer erro faz rollback.
--   * Filtra por nome da experiência E data 05/09 E status ativo
--     ('pago'/'pending'), então não encosta em reserva cancelada,
--     em outra data da mesma experiência nem em outra experiência.
--   * Aborta se não encontrar nenhuma reserva (erro de filtro é
--     mais provável que "ninguém comprou").
--   * Idempotente: na segunda execução o endereço já é o novo, o
--     WHERE não casa com nada e endereco_anterior fica preservado.
-- =============================================================

begin;

-- ===== 1. Confere o alvo antes de escrever =====
do $$
declare v_total int;
begin
  select count(*) into v_total
    from public.bookings b
   where b.experiencia_nome ilike '%folding book%'
     and b.data like '05/09%'
     and b.status in ('pago', 'pending');

  if v_total = 0 then
    raise exception
      'Nenhuma reserva ativa encontrada para Folding Book em 05/09. Confira nome e data com: select id, experiencia_nome, data, status from public.bookings where experiencia_nome ilike ''%%folding%%'';';
  end if;

  raise notice 'Reservas que vao receber o novo endereco: %', v_total;
end $$;

-- ===== 2. Guarda o estado anterior (aparece na conferência) =====
drop table if exists _antes_folding;
create temporary table _antes_folding as
select b.id, b.nome, b.email, b.status,
       b.metadata->>'endereco' as endereco_antigo,
       b.metadata->>'bairro'   as bairro_antigo
  from public.bookings b
 where b.experiencia_nome ilike '%folding book%'
   and b.data like '05/09%'
   and b.status in ('pago', 'pending');

-- ===== 3. Reescreve o endereço das reservas =====
-- Merge (||) em vez de sobrescrever metadata inteiro: metadata carrega
-- acompanhantes, política de remarcação, cupom e origem do pagamento.
-- Perder isso pra corrigir um endereço seria um estrago bem maior.
update public.bookings b
   set metadata = coalesce(b.metadata, '{}'::jsonb)
                  || jsonb_build_object(
                       'endereco', 'Rua Oscar Freire, 1128',
                       'bairro', 'Cerqueira César (Jardins)',
                       'endereco_anterior', coalesce(b.metadata->>'endereco', ''),
                       'bairro_anterior', coalesce(b.metadata->>'bairro', ''),
                       'endereco_alterado_em', now()::text
                     )
 where b.experiencia_nome ilike '%folding book%'
   and b.data like '05/09%'
   and b.status in ('pago', 'pending')
   and coalesce(b.metadata->>'endereco', '') is distinct from 'Rua Oscar Freire, 1128';

commit;

-- ===== 4. Conferência: antes x depois =====
select a.nome, a.email, a.status,
       a.endereco_antigo, a.bairro_antigo,
       b.metadata->>'endereco' as endereco_novo,
       b.metadata->>'bairro'   as bairro_novo
  from _antes_folding a
  join public.bookings b on b.id = a.id
 order by a.status, a.nome;

-- ===== 5. Quem precisa ser avisado =====
-- A tela só mostra o novo local pra quem abrir a página. A dois dias
-- do evento, o aviso ativo é o que evita alguém aparecer no endereço
-- errado — use esta lista pro WhatsApp/e-mail.
select b.nome, b.email, b.telefone, b.data, b.horario, b.status
  from public.bookings b
 where b.experiencia_nome ilike '%folding book%'
   and b.data like '05/09%'
   and b.status in ('pago', 'pending')
 order by b.status, b.created_at;

drop table if exists _antes_folding;
