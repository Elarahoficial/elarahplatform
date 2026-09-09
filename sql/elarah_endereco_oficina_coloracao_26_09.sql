-- =============================================================
-- ELARAH — Troca de endereço da
--          "Oficina de Coloração Pessoal & Colagem de Estilo"
--          do dia 26/09/2026
-- -------------------------------------------------------------
-- CONTEXTO
--   O local da oficina mudou para o BETC Havas Café, na Rua
--   Oscar Freire. Quem já comprou precisa ver o endereço novo —
--   tanto na área "Minhas compras" quanto num eventual reenvio
--   do e-mail de confirmação.
--
-- POR QUE NÃO BASTA ATUALIZAR experiences.endereco
--   O endereço que o cliente vê é um SNAPSHOT gravado em
--   bookings.metadata.endereco / .bairro no momento do checkout
--   (create-checkout-session, create-mp-pix-payment). Tanto a
--   conta.js (card da compra) quanto a edge function
--   resend-booking-confirmation leem desse metadata, não da
--   tabela experiences. Sem reescrever o metadata, o cliente
--   continuaria vendo o endereço antigo mesmo depois da troca.
--   Por isso este script mexe nos DOIS lugares:
--     1. experiences  → vitrine e compras novas
--     2. bookings     → quem já comprou
--
-- COMO RODAR
--   Cola tudo no SQL Editor do Supabase e clica Run.
--   Tudo em transação única (BEGIN/COMMIT).
--
-- VERIFICAÇÕES (aborta com rollback se falhar)
--   1. Encontra exatamente 1 experiência com o nome esperado.
--   2. Encontra pelo menos 1 slot OU 1 reserva do dia 26/09.
--
-- GUARDA DA VITRINE
--   O endereço é um campo da EXPERIÊNCIA, não do slot — não dá
--   pra ter endereço diferente por data. Se a experiência tiver
--   outros slots ativos em datas diferentes de 26/09, o script
--   NÃO mexe em experiences (mudaria o local das outras datas
--   também) e avisa por NOTICE; as reservas do dia 26/09 são
--   atualizadas do mesmo jeito.
--
-- IDEMPOTENTE
--   Rodar de novo não causa efeito colateral: os UPDATEs já
--   filtram pelo endereço antigo/divergente e viram no-op.
--
-- DEPOIS DE RODAR
--   A query final lista quem comprou. Para cada reserva do site,
--   usar o botão "📧 Reenviar confirmação" no painel admin — o
--   e-mail sai com o endereço novo. Vendas manuais não guardam
--   endereço; avisar essas pessoas pelo WhatsApp.
-- =============================================================

begin;

do $$
declare
  -- ---- Parâmetros da troca (ajuste aqui se precisar) ----
  v_novo_endereco constant text := 'BETC Havas Café – Rua Oscar Freire, 1.128 – São Paulo';
  v_novo_bairro   constant text := 'Jardins (Cerqueira César)';
  v_data          constant date := date '2026-09-26';
  -- Rótulos textuais usados em experience_slots.data / bookings.data
  -- (slots antigos guardam só o rótulo, sem event_at).
  v_labels        constant text[] := array['26/09', '26/09/2026'];

  v_exp_count       integer;
  v_exp_id          uuid;
  v_exp_nome        text;
  v_end_antigo      text;
  v_bairro_antigo   text;
  v_slot_ids        uuid[];
  v_outros_slots    integer;
  v_bookings_alvo   integer;
  v_bookings_upd    integer;
  v_manual_alvo     integer;
begin
  -- ===== 1. Localiza a experiência =====
  select count(*) into v_exp_count
    from public.experiences
   where nome ilike '%colora%pessoal%';

  if v_exp_count = 0 then
    raise exception 'Nenhuma experiência com nome tipo "Coloração Pessoal" encontrada — confira o nome cadastrado.';
  elsif v_exp_count > 1 then
    raise exception 'Encontradas % experiências com nome tipo "Coloração Pessoal" — ambíguo, rode com o id fixo.', v_exp_count;
  end if;

  select id, nome, endereco, bairro
    into v_exp_id, v_exp_nome, v_end_antigo, v_bairro_antigo
    from public.experiences
   where nome ilike '%colora%pessoal%';

  raise notice 'Experiência: % (id %)', v_exp_nome, v_exp_id;
  raise notice 'Endereço atual: % — %', coalesce(v_end_antigo, '(vazio)'), coalesce(v_bairro_antigo, '(vazio)');

  -- ===== 2. Localiza os slots do dia 26/09 =====
  -- event_at é timestamptz: converte pra America/Sao_Paulo antes de
  -- comparar, senão oficina da noite cai no dia seguinte em UTC.
  -- O OR com o rótulo textual pesca slots antigos sem event_at.
  select coalesce(array_agg(s.id), '{}'::uuid[])
    into v_slot_ids
    from public.experience_slots s
   where s.experience_id = v_exp_id
     and (
           (s.event_at is not null
            and (s.event_at at time zone 'America/Sao_Paulo')::date = v_data)
        or (s.event_at is null and s.data = any(v_labels))
     );

  raise notice 'Slots do dia 26/09 encontrados: %', coalesce(array_length(v_slot_ids, 1), 0);

  -- ===== 3. Reservas alvo (site) =====
  -- Casa por slot_id quando existe; reservas antigas sem slot_id
  -- caem no fallback do rótulo de data.
  select count(*)
    into v_bookings_alvo
    from public.bookings b
   where b.status in ('pago', 'pending')
     and (
           (b.slot_id is not null and b.slot_id = any(v_slot_ids))
        or (b.slot_id is null and b.experiencia_id = v_exp_id and b.data = any(v_labels))
     );

  if coalesce(array_length(v_slot_ids, 1), 0) = 0 and v_bookings_alvo = 0 then
    raise exception 'Nenhum slot nem reserva do dia 26/09 para "%" — nada a fazer, confira a data.', v_exp_nome;
  end if;

  -- ===== 4. Vitrine: só se 26/09 for a única data ativa =====
  select count(*)
    into v_outros_slots
    from public.experience_slots s
   where s.experience_id = v_exp_id
     and s.is_active
     and not (s.id = any(v_slot_ids));

  if v_outros_slots > 0 then
    raise notice 'ATENÇÃO: a experiência tem % outro(s) slot(s) ativo(s) em datas diferentes.', v_outros_slots;
    raise notice 'experiences.endereco NÃO foi alterado (mudaria o local das outras datas também).';
    raise notice 'Se as outras datas também mudaram de local, edite o endereço pelo painel admin.';
  else
    update public.experiences
       set endereco = v_novo_endereco,
           bairro   = v_novo_bairro
     where id = v_exp_id
       and (endereco is distinct from v_novo_endereco
            or bairro is distinct from v_novo_bairro);

    raise notice 'experiences atualizada: % — %', v_novo_endereco, v_novo_bairro;
  end if;

  -- ===== 5. Quem já comprou: reescreve o snapshot do metadata =====
  -- O `||` faz merge no jsonb: sobrescreve endereco/bairro e
  -- preserva o resto (participantes, política de remarcação,
  -- variante etc.), que o e-mail de confirmação também usa.
  update public.bookings b
     set metadata = coalesce(b.metadata, '{}'::jsonb)
                    || jsonb_build_object(
                         'endereco', v_novo_endereco,
                         'bairro',   v_novo_bairro
                       )
   where b.status in ('pago', 'pending')
     and (
           (b.slot_id is not null and b.slot_id = any(v_slot_ids))
        or (b.slot_id is null and b.experiencia_id = v_exp_id and b.data = any(v_labels))
     )
     and (b.metadata->>'endereco' is distinct from v_novo_endereco
          or b.metadata->>'bairro' is distinct from v_novo_bairro);

  get diagnostics v_bookings_upd = row_count;

  raise notice 'Reservas do site alvo: % | atualizadas agora: % (o resto já estava com o endereço novo)',
    v_bookings_alvo, v_bookings_upd;

  -- ===== 6. Vendas manuais: nada a atualizar, só contagem =====
  -- manual_sales não guarda endereço (nem em coluna nem em
  -- snapshot) — o e-mail dessas vendas lê da experiences. Ficam
  -- aqui só pra entrar na lista de quem precisa ser avisado.
  select count(*)
    into v_manual_alvo
    from public.manual_sales ms
   where ms.payment_status in ('pago', 'pendente')
     and (
           (ms.slot_id is not null and ms.slot_id = any(v_slot_ids))
        or (ms.slot_id is null and ms.experience_id = v_exp_id and ms.slot_date = v_data)
     );

  raise notice 'Vendas manuais do dia 26/09: % (avisar por WhatsApp)', v_manual_alvo;
end $$;

commit;


-- =============================================================
-- CONFERÊNCIA — endereço que cada pessoa vai ver agora
-- -------------------------------------------------------------
-- Só leitura. `endereco_visivel` é exatamente o que a conta.js e
-- o e-mail de confirmação montam (endereco — bairro).
-- =============================================================
with exp as (
  select id, nome from public.experiences where nome ilike '%colora%pessoal%'
),
slots as (
  select s.id
    from public.experience_slots s
    join exp e on e.id = s.experience_id
   where (s.event_at is not null
          and (s.event_at at time zone 'America/Sao_Paulo')::date = date '2026-09-26')
      or (s.event_at is null and s.data in ('26/09', '26/09/2026'))
)
select
  'site'                    as origem,
  b.nome                    as cliente,
  b.email,
  b.telefone,
  b.quantidade              as pessoas,
  b.status,
  case
    when nullif(b.metadata->>'endereco', '') is not null
     and nullif(b.metadata->>'bairro', '') is not null
      then (b.metadata->>'endereco') || ' — ' || (b.metadata->>'bairro')
    else coalesce(nullif(b.metadata->>'endereco', ''), nullif(b.metadata->>'bairro', ''), '(sem endereço)')
  end                       as endereco_visivel,
  b.id                      as booking_id
from public.bookings b
cross join exp e
where b.status in ('pago', 'pending')
  and (b.slot_id in (select id from slots)
       or (b.slot_id is null and b.experiencia_id = e.id and b.data in ('26/09', '26/09/2026')))

union all

select
  'manual'                  as origem,
  ms.customer_name          as cliente,
  ms.customer_email         as email,
  ms.customer_phone         as telefone,
  ms.quantity               as pessoas,
  ms.payment_status         as status,
  '(avisar por WhatsApp — venda manual não guarda endereço)' as endereco_visivel,
  ms.id                     as booking_id
from public.manual_sales ms
cross join exp e
where ms.payment_status in ('pago', 'pendente')
  and (ms.slot_id in (select id from slots)
       or (ms.slot_id is null and ms.experience_id = e.id and ms.slot_date = date '2026-09-26'))

order by origem, cliente;
