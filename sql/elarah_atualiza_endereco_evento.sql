-- =============================================================
-- ELARAH — Troca de local de um evento já vendido
-- -------------------------------------------------------------
-- Quando o endereço de uma experiência muda depois de já haver
-- gente que comprou, dois lugares guardam endereço:
--
--   1. public.experiences.endereco / .bairro
--      Fonte da verdade. Alimenta a página da experiência, o
--      checkout, o aviso ao fornecedor no admin e — depois da
--      correção em conta.js — a aba "Minhas compras".
--
--   2. public.bookings.metadata->>'endereco' / 'bairro'
--      Snapshot congelado no momento do checkout. Alimenta o
--      e-mail de confirmação (inclusive o reenvio via
--      resend-booking-confirmation) e os lembretes automáticos
--      (automated-notifications). Mudar só a experiência deixa
--      esse snapshot velho: o e-mail continua mandando a cliente
--      pro endereço antigo.
--
-- Este script atualiza os dois, na mesma transação.
--
-- COMO RODAR
--   1. Preencha o bloco PARÂMETROS abaixo (id da experiência e o
--      novo endereço/bairro).
--   2. Cole tudo no SQL Editor do Supabase e clique Run.
--
-- SEGURANÇA
--   * Transação única: qualquer erro faz rollback.
--   * Só mexe em reservas não canceladas (status 'pago'/'pending').
--     Cancelada/reembolsada/expirada fica intacta: é registro
--     histórico, não gente que vai aparecer no novo endereço.
--   * ATENÇÃO em experiência RECORRENTE (vários slots na mesma
--     experiência): o filtro é por experiencia_id, então reservas
--     de datas passadas também seriam reescritas, apagando o
--     endereço onde a turma de fato esteve. Nesse caso, acrescente
--     um filtro de data no UPDATE do passo 4 (ex.: and b.data =
--     '05/09') antes de rodar. Pra experiência de data única — o
--     caso normal de troca de local de evento — não precisa.
--   * Aborta se o id da experiência não existir.
--   * Idempotente: rodar de novo não muda nada (o endereço já é o
--     novo) e não duplica histórico.
--
-- DEPOIS DE RODAR
--   Avise quem já comprou. A aba "Minhas compras" passa a mostrar
--   "Novo local" com o endereço antigo riscado, mas ninguém abre a
--   página por acaso — mande WhatsApp/e-mail pra lista que a query
--   final deste script devolve.
-- =============================================================

begin;

-- ===== PARÂMETROS =====
-- Troque os três valores abaixo. O id sai do admin (Experiências →
-- a experiência → campo id) ou da query de apoio no fim do arquivo.
drop table if exists _params;
drop table if exists _antes;

create temporary table _params as
select
  '00000000-0000-0000-0000-000000000000'::uuid as exp_id,
  'Rua Exemplo, 123'::text                     as novo_endereco,
  'Pinheiros'::text                            as novo_bairro;

-- ===== 1. Confere que a experiência existe =====
do $$
declare v_nome text;
begin
  select e.nome into v_nome
    from public.experiences e, _params p
   where e.id = p.exp_id;
  if v_nome is null then
    raise exception 'Experiência % não encontrada — confira o exp_id nos PARÂMETROS.',
      (select exp_id from _params);
  end if;
  raise notice 'Alterando local da experiência: %', v_nome;
end $$;

-- ===== 2. Guarda o endereço antigo (aparece no output) =====
create temporary table _antes as
select e.id, e.nome, e.endereco as endereco_antigo, e.bairro as bairro_antigo
  from public.experiences e, _params p
 where e.id = p.exp_id;

-- ===== 3. Atualiza a fonte da verdade =====
update public.experiences e
   set endereco = p.novo_endereco,
       bairro   = p.novo_bairro
  from _params p
 where e.id = p.exp_id;

-- ===== 4. Atualiza o snapshot das reservas ativas =====
-- Merge (||) em vez de sobrescrever metadata inteiro: metadata carrega
-- acompanhantes, política de remarcação, cupom, origem do pagamento.
-- Perder isso pra corrigir um endereço seria um estrago bem maior.
-- endereco_anterior/bairro_anterior não são só auditoria: conta.js lê
-- os dois pra mostrar "Novo local" com o endereço velho riscado. Sem
-- eles, depois deste update o snapshot já é o endereço novo e a tela
-- trocaria o endereço em silêncio — que é justamente o jeito de a
-- cliente ir pro lugar errado.
update public.bookings b
   set metadata = coalesce(b.metadata, '{}'::jsonb)
                  || jsonb_build_object(
                       'endereco', p.novo_endereco,
                       'bairro', p.novo_bairro,
                       'endereco_anterior', coalesce(b.metadata->>'endereco', ''),
                       'bairro_anterior', coalesce(b.metadata->>'bairro', ''),
                       'endereco_alterado_em', now()::text
                     )
  from _params p
 where b.experiencia_id = p.exp_id
   and b.status in ('pago', 'pending')
   and coalesce(b.metadata->>'endereco', '') is distinct from p.novo_endereco;

commit;

-- ===== 5. Confirmação: o que mudou =====
select a.nome,
       a.endereco_antigo, a.bairro_antigo,
       e.endereco as endereco_novo, e.bairro as bairro_novo
  from _antes a
  join public.experiences e on e.id = a.id;

-- ===== 6. Quem precisa ser avisado =====
-- Lista de contato de quem já comprou e ainda vai ao evento.
select b.nome, b.email, b.telefone, b.data, b.horario, b.status,
       b.metadata->>'endereco_anterior' as endereco_antigo
  from public.bookings b, _params p
 where b.experiencia_id = p.exp_id
   and b.status in ('pago', 'pending')
 order by b.status, b.created_at;

-- ===== 7. Limpeza das tabelas temporárias =====
drop table if exists _antes;
drop table if exists _params;

-- =============================================================
-- APOIO — achar o id da experiência pelo nome:
--   select id, nome, data, endereco, bairro
--     from public.experiences
--    where nome ilike '%tufting%';
-- =============================================================
