-- =============================================================
-- ELARAH — Aviso automático de "a data saiu" (By Elarah)
-- -------------------------------------------------------------
-- PROBLEMA QUE ISSO RESOLVE
--   Todo evento By Elarah abre primeiro como LISTA DE ESPERA
--   ("Data em breve") e as pessoas deixam nome/WhatsApp no
--   formulário da home (byelarah_submissions). Quando a data era
--   publicada, alguém tinha que abrir o painel e disparar o
--   follow-up na mão, pessoa por pessoa (ou em lote).
--   Agora: assim que a data é publicada no item, TODO MUNDO que se
--   inscreveu naquele item recebe, sozinho, um WhatsApp com a data,
--   o horário, o local e o LINK pra se inscrever.
--
-- COMO FUNCIONA
--   1. Trigger detecta o evento ABRINDO pra lista. Vale nas DUAS fontes
--      da aba By Elarah:
--        * public.experiences com is_elarah_original = true (onde os
--          eventos vivem HOJE — lista de espera = cta_mode 'waitlist');
--        * public.byelarah_items (legado).
--      São
--      DOIS sinais, e qualquer um basta:
--        a) a DATA foi publicada (o campo Data deixa de ser "em breve");
--        b) o evento SAIU DA LISTA DE ESPERA — em experiences, cta_mode
--           vai de 'waitlist' pra 'buy'; em byelarah_items, tipo vira
--           "participar" ou o checkout é ligado. Este sinal é
--           inequívoco: não depende de interpretar texto livre.
--      Quando (b) acontece sem data no texto, a data é buscada na
--      experiência vinculada (event_at da experience ou do próximo slot).
--      Sem data em lugar nenhum, o aviso vira "as inscrições abriram".
--   2. A trigger NÃO envia nada: ela enfileira UMA linha em
--      byelarah_date_announcements (a "onda" de avisos).
--   3. A Edge Function byelarah-aviso-data (cron a cada 5 min, e
--      também chamada na hora pelo painel ao salvar) consome a fila
--      e envia pelo PORTÃO ÚNICO de WhatsApp (gatedSendWhatsApp):
--      idempotência, kill switch, modo observação, rollout,
--      allowlist, fail-closed. Nada aqui fura esse portão.
--
-- TRAVAS CONTRA DISPARO INDEVIDO
--   * Só UPDATE (nunca INSERT): item recém-criado não tem lista de
--     espera pra avisar, e slug reaproveitado num import não vira
--     disparo pra base antiga.
--   * Uma onda por item a cada 48h: publicar a data e ligar o checkout
--     em dois saves seguidos (o fluxo normal do painel) manda UMA
--     mensagem, não duas.
--   * UNIQUE (item_id, data_texto): a MESMA data do MESMO item só
--     gera uma onda, pra sempre. Desligar/ligar o item, reeditar
--     local/horário ou salvar de novo não reenvia. Remarcar pra uma
--     data DIFERENTE gera uma onda nova (a lista precisa saber) — e
--     quem foi avisado há menos de 12h é pulado pela função, o que
--     cobre o caso "corrigi um typo na data logo depois de publicar".
--   * byelarah_items.avisar_interessados = false desliga o
--     automático por item (a admin continua podendo disparar na mão
--     pelo painel).
--   * byelarah_data_definida() só considera "data publicada" um
--     texto que tem dia + mês. "Data em breve", "a definir",
--     "em breve" etc. continuam sendo lista de espera.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
--
-- Como rodar:
--   Supabase Dashboard → SQL Editor → cola este arquivo → Run.
--   Depois rode sql/elarah_byelarah_aviso_data_cron.sql pra agendar.
-- =============================================================

-- -------------------------------------------------------------
-- 1) Controles no item By Elarah
-- -------------------------------------------------------------
-- avisar_interessados: chave por item. Default true (o
-- comportamento pedido), mas a admin pode desligar num item em que
-- o aviso não faz sentido (ex.: evento privado, teste interno).
alter table public.byelarah_items
  add column if not exists avisar_interessados boolean not null default true;

-- Mesma chave em experiences: como os eventos By Elarah vivem lá hoje,
-- a admin precisa poder desligar o automático num evento específico.
alter table public.experiences
  add column if not exists avisar_interessados boolean not null default true;

comment on column public.experiences.avisar_interessados is
  'Quando true (default), abrir o evento (cta_mode waitlist→buy ou data publicada) dispara o aviso automático pra lista de interesse.';

-- link_inscricao: link que vai na mensagem. Opcional — quando
-- vazio, a trigger monta sozinha (experiência comprável → página de
-- checkout; senão → âncora do card na home). Serve pra apontar pra
-- uma landing page dedicada quando existir.
alter table public.byelarah_items
  add column if not exists link_inscricao text;

comment on column public.byelarah_items.avisar_interessados is
  'Quando true (default), publicar a data dispara o aviso automático de WhatsApp pra quem está na lista de interesse deste item.';
comment on column public.byelarah_items.link_inscricao is
  'Link de inscrição usado na mensagem de aviso de data. Vazio = montado automaticamente (experiencia.html?id=... ou âncora na home).';

-- -------------------------------------------------------------
-- 2) Tracking por interessada
-- -------------------------------------------------------------
-- Guarda QUAL onda de aviso a pessoa já recebeu. É o que permite a
-- Edge Function retomar de onde parou (lotes / timeout) sem
-- reenviar pra quem já recebeu.
alter table public.byelarah_submissions
  add column if not exists aviso_data_sent_at timestamptz,
  add column if not exists aviso_data_announcement_id uuid;

create index if not exists byelarah_submissions_aviso_data_idx
  on public.byelarah_submissions (aviso_data_announcement_id)
  where aviso_data_announcement_id is not null;

-- -------------------------------------------------------------
-- 3) "Isso é uma data publicada ou ainda é lista de espera?"
-- -------------------------------------------------------------
-- O campo `data` do item é texto livre ("24 de abril", "12/10",
-- "Data em breve"). Esta função é a regra única que decide se o
-- texto já é uma data DE VERDADE. Conservadora de propósito: na
-- dúvida responde false (não avisa). Under-match é seguro — a admin
-- dispara na mão; over-match manda mensagem errada pra base inteira.
create or replace function public.byelarah_data_definida(raw text)
returns boolean
language plpgsql
immutable
as $$
declare
  t text;
begin
  t := lower(btrim(coalesce(raw, '')));
  if t = '' then
    return false;
  end if;

  -- Textos de espera explícitos: nunca contam como data publicada,
  -- mesmo que tenham número junto ("nova data em breve").
  if t ~ '(em breve|a definir|a combinar|a confirmar|sem data|pr[oó]xima turma|proximamente|pr[oó]ximamente|lista de espera)' then
    return false;
  end if;

  -- Formato numérico: 12/10, 12/10/2026, 12-10.
  if t ~ '\d{1,2}\s*[/-]\s*\d{1,2}' then
    return true;
  end if;

  -- Formato por extenso: precisa de dia (número) E mês (nome).
  if t ~ '\d{1,2}' and t ~ '(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)' then
    return true;
  end if;

  return false;
end;
$$;

comment on function public.byelarah_data_definida(text) is
  'Regra única: o texto livre de byelarah_items.data já é uma data publicada? Conservadora — na dúvida, false (não dispara aviso).';

-- -------------------------------------------------------------
-- 3b) Data por extenso a partir de um timestamp
-- -------------------------------------------------------------
-- Quando o item abre pelo checkout, a data real está em
-- experiences.event_at (ou no próximo slot), não no texto livre. Esta
-- função devolve "24 de abril" pra mensagem ficar natural.
create or replace function public.byelarah_data_extenso(ts timestamptz)
returns text
language sql
stable
as $$
  select case
    when ts is null then ''
    else ltrim(to_char(ts at time zone 'America/Sao_Paulo', 'DD'), '0') || ' de ' ||
      (array['janeiro','fevereiro','março','abril','maio','junho','julho',
             'agosto','setembro','outubro','novembro','dezembro'])
        [extract(month from ts at time zone 'America/Sao_Paulo')::int]
  end;
$$;

-- -------------------------------------------------------------
-- 4) Fila de ondas de aviso
-- -------------------------------------------------------------
-- Uma linha = "avisar todo mundo da lista do item X de que a data
-- é Y". A trigger só ENFILEIRA; quem envia é a Edge Function.
-- Separar as duas coisas é o que permite: enviar em lotes, retomar
-- depois de timeout, ver no painel quantos já receberam, e cancelar
-- uma onda antes de ela sair.
create table if not exists public.byelarah_date_announcements (
  id             uuid primary key default gen_random_uuid(),
  -- De onde veio o evento. UM dos dois é preenchido (hoje, na prática,
  -- experience_id — byelarah_items é legado).
  item_id        uuid references public.byelarah_items(id) on delete cascade,
  experience_id  uuid references public.experiences(id) on delete cascade,
  -- Identidade ÚNICA do evento pra fins de anti-duplicata: a experiência
  -- quando existe, senão o item legado. É o que impede que o mesmo evento
  -- gere duas ondas ao salvar (o painel escreve nas duas tabelas).
  alvo_id        uuid,
  -- Snapshot do item NO MOMENTO da publicação. Guardado (em vez de
  -- ler o item na hora do envio) pra que uma edição posterior não
  -- mude o texto de uma onda que já começou a sair.
  item_slug      text not null,
  item_nome      text not null,
  data_texto     text not null,
  local          text not null default '',
  horarios       jsonb not null default '[]'::jsonb,
  imagem         text not null default '',
  link           text,
  -- O que abriu: 'data' (tem data pra anunciar) ou 'inscricoes' (abriu
  -- sem data conhecida). Decide QUAL mensagem/template é usado.
  motivo         text not null default 'data'
                 check (motivo in ('data', 'inscricoes')),
  origem         text not null default 'trigger'
                 check (origem in ('trigger', 'manual')),
  status         text not null default 'pendente'
                 check (status in ('pendente', 'enviando', 'concluido', 'cancelado')),
  total_alvo     integer not null default 0,   -- telefones únicos na lista
  enviados       integer not null default 0,
  observados     integer not null default 0,   -- modo observação (não enviou)
  pulados        integer not null default 0,   -- sem telefone / rollout / cooldown
  erro           text,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  started_at     timestamptz,
  processed_at   timestamptz
);

-- Pra quem já rodou uma versão anterior deste arquivo.
alter table public.byelarah_date_announcements
  add column if not exists motivo text not null default 'data',
  add column if not exists experience_id uuid references public.experiences(id) on delete cascade,
  add column if not exists alvo_id uuid;

update public.byelarah_date_announcements
   set alvo_id = coalesce(experience_id, item_id)
 where alvo_id is null;

do $$
begin
  alter table public.byelarah_date_announcements
    add constraint byelarah_date_ann_motivo_check
    check (motivo in ('data', 'inscricoes'));
exception when duplicate_object then null;
end $$;

-- A TRAVA. Mesma data do mesmo evento = uma onda só, pra sempre. Por
-- alvo_id (experiência, quando existe) pra que item legado + experiência
-- vinculada contem como o MESMO evento.
drop index if exists byelarah_date_ann_item_data_uidx;
create unique index if not exists byelarah_date_ann_alvo_data_uidx
  on public.byelarah_date_announcements (alvo_id, data_texto);

create index if not exists byelarah_date_ann_status_idx
  on public.byelarah_date_announcements (status, created_at);

alter table public.byelarah_date_announcements enable row level security;

-- Painel admin lê (pra mostrar o status da onda) e pode cancelar
-- uma onda pendente. Quem escreve de verdade é a Edge Function
-- (service_role, que ignora RLS).
drop policy if exists "byelarah_date_ann_admin_read" on public.byelarah_date_announcements;
create policy "byelarah_date_ann_admin_read"
  on public.byelarah_date_announcements
  for select to authenticated
  using (public.is_admin());

drop policy if exists "byelarah_date_ann_admin_insert" on public.byelarah_date_announcements;
create policy "byelarah_date_ann_admin_insert"
  on public.byelarah_date_announcements
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "byelarah_date_ann_admin_update" on public.byelarah_date_announcements;
create policy "byelarah_date_ann_admin_update"
  on public.byelarah_date_announcements
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.byelarah_date_announcements is
  'Fila de avisos "a data saiu" de itens By Elarah. Trigger enfileira; Edge Function byelarah-aviso-data envia pelo portão de WhatsApp.';

-- -------------------------------------------------------------
-- 5) A trigger
-- -------------------------------------------------------------
create or replace function public.byelarah_enqueue_aviso_data()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  data_pub_antes   boolean;
  data_pub_agora   boolean;
  virou_data       boolean;
  abriu_inscricoes boolean;
  virou_ativo      boolean;
  data_final       text;
  motivo_final     text;
  link_final       text;
  alvo             uuid;
  ja_tem_onda      boolean;
begin
  if new.ativo is not true then
    return new;                                   -- oculto não avisa ninguém
  end if;
  if new.avisar_interessados is not true then
    return new;                                   -- chave desligada neste item
  end if;
  -- Sem slug não dá pra saber com segurança QUEM é a lista desse item —
  -- e mandar pra lista errada é o pior resultado possível.
  if coalesce(btrim(new.slug), '') = '' then
    return new;
  end if;

  data_pub_antes := public.byelarah_data_definida(old.data);
  data_pub_agora := public.byelarah_data_definida(new.data);

  -- SINAL A — a data foi publicada (ou remarcada pra outra data).
  virou_data := data_pub_agora and (
    not data_pub_antes or
    btrim(coalesce(old.data, '')) is distinct from btrim(coalesce(new.data, ''))
  );

  -- SINAL B — o item SAIU DA LISTA DE ESPERA: virou "participar" ou o
  -- checkout foi ligado. Sinal inequívoco: não depende de texto livre.
  abriu_inscricoes :=
    (new.tipo = 'participar' and old.tipo is distinct from 'participar') or
    (new.experience_id is not null and old.experience_id is null);

  -- SINAL C — estava oculto com tudo pronto e acabou de ir pro ar.
  virou_ativo := (old.ativo is not true) and (data_pub_agora or new.tipo = 'participar');

  if not (virou_data or abriu_inscricoes or virou_ativo) then
    return new;
  end if;

  -- ANTI-DUPLICATA DE OPERAÇÃO: publicar a data e ligar o checkout em dois
  -- saves seguidos é o fluxo normal do painel. Uma onda nas últimas 48h
  -- (que não foi cancelada) já cobre a lista — não enfileira outra.
  -- Identidade do evento: a experiência vinculada quando existe (é ela
  -- que a outra trigger usa), senão o próprio item legado.
  alvo := coalesce(new.experience_id, new.id);

  select exists (
    select 1 from public.byelarah_date_announcements
     where alvo_id = alvo
       and status <> 'cancelado'
       and created_at > now() - interval '48 hours'
  ) into ja_tem_onda;
  if ja_tem_onda then
    return new;
  end if;

  -- QUAL DATA ANUNCIAR: o texto livre, se for data de verdade; senão a data
  -- real da experiência vinculada (event_at da experience ou do próximo
  -- slot). Sem nada disso, o aviso vira "as inscrições abriram".
  data_final := case when data_pub_agora then btrim(new.data) else '' end;

  if data_final = '' and new.experience_id is not null then
    select public.byelarah_data_extenso(e.event_at)
      into data_final
      from public.experiences e
     where e.id = new.experience_id;
    data_final := coalesce(data_final, '');
  end if;

  if data_final = '' and new.experience_id is not null then
    select public.byelarah_data_extenso(min(s.event_at))
      into data_final
      from public.experience_slots s
     where s.experience_id = new.experience_id
       and s.is_active is true
       and s.event_at >= now();
    data_final := coalesce(data_final, '');
  end if;

  motivo_final := case when data_final = '' then 'inscricoes' else 'data' end;

  -- Link da mensagem: override manual > checkout da experiência vinculada >
  -- âncora do card na home.
  link_final := nullif(btrim(coalesce(new.link_inscricao, '')), '');
  if link_final is null and new.experience_id is not null then
    link_final := 'https://elarah.com.br/experiencia.html?id=' || new.experience_id::text;
  end if;
  if link_final is null then
    link_final := 'https://elarah.com.br/index.html#by-elarah-' || btrim(new.slug);
  end if;

  insert into public.byelarah_date_announcements
    (item_id, experience_id, alvo_id, item_slug, item_nome, data_texto,
     local, horarios, imagem, link, motivo, origem)
  values
    (new.id,
     new.experience_id,
     alvo,
     btrim(new.slug),
     btrim(new.nome),
     data_final,
     coalesce(new.local, ''),
     coalesce(new.horarios, '[]'::jsonb),
     coalesce(new.imagem, ''),
     link_final,
     motivo_final,
     'trigger')
  on conflict (alvo_id, data_texto) do nothing;

  return new;
end;
$$;

-- SÓ UPDATE, de propósito (ver "TRAVAS" no topo).
drop trigger if exists byelarah_items_aviso_data on public.byelarah_items;
create trigger byelarah_items_aviso_data
  after update on public.byelarah_items
  for each row
  execute function public.byelarah_enqueue_aviso_data();

-- -------------------------------------------------------------
-- 6) A trigger em EXPERIENCES (onde os eventos By Elarah vivem hoje)
-- -------------------------------------------------------------
-- Mesma lógica da trigger de byelarah_items, adaptada:
--   * lista de espera  = cta_mode 'waitlist'
--   * abriu inscrições = cta_mode vira 'buy'
--   * data real        = campo `data` (texto) ou event_at / próximo slot
-- Só mexe em experiência marcada como Elarah Original — o catálogo
-- normal não dispara nada.
create or replace function public.byelarah_enqueue_aviso_experiencia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  data_pub_antes   boolean;
  data_pub_agora   boolean;
  virou_data       boolean;
  abriu_inscricoes boolean;
  virou_ativo      boolean;
  data_final       text;
  motivo_final     text;
  local_final      text;
  slug_legado      text;
  ja_tem_onda      boolean;
begin
  if new.is_elarah_original is not true then
    return new;                                   -- catálogo normal: fora
  end if;
  if new.is_active is not true then
    return new;                                   -- oculta não avisa ninguém
  end if;
  if coalesce(new.avisar_interessados, true) is not true then
    return new;                                   -- chave desligada
  end if;
  if coalesce(btrim(new.nome), '') = '' then
    return new;                                   -- sem nome não dá pra casar a lista
  end if;

  data_pub_antes := public.byelarah_data_definida(old.data);
  data_pub_agora := public.byelarah_data_definida(new.data);

  -- SINAL A — data publicada (ou remarcada), no texto ou no event_at.
  virou_data := (data_pub_agora and (
                  not data_pub_antes or
                  btrim(coalesce(old.data, '')) is distinct from btrim(coalesce(new.data, ''))
                ))
                or (new.event_at is not null and old.event_at is distinct from new.event_at);

  -- SINAL B — SAIU DA LISTA DE ESPERA (o sinal inequívoco).
  abriu_inscricoes :=
    (coalesce(new.cta_mode, 'buy') = 'buy' and coalesce(old.cta_mode, 'buy') = 'waitlist')
    or (new.is_elarah_original is true and old.is_elarah_original is not true
        and coalesce(new.cta_mode, 'buy') = 'buy');

  -- SINAL C — estava oculta com tudo pronto e acabou de ir pro ar.
  virou_ativo := (old.is_active is not true) and (data_pub_agora or new.event_at is not null);

  if not (virou_data or abriu_inscricoes or virou_ativo) then
    return new;
  end if;

  -- Uma onda por evento a cada 48h (o painel salva experiência e item
  -- legado em sequência — isso garante UMA mensagem, não duas).
  select exists (
    select 1 from public.byelarah_date_announcements
     where alvo_id = new.id
       and status <> 'cancelado'
       and created_at > now() - interval '48 hours'
  ) into ja_tem_onda;
  if ja_tem_onda then
    return new;
  end if;

  -- QUAL DATA ANUNCIAR: texto livre → event_at → próximo slot com vaga.
  data_final := case when data_pub_agora then btrim(new.data) else '' end;
  if data_final = '' then
    data_final := coalesce(public.byelarah_data_extenso(new.event_at), '');
  end if;
  if data_final = '' then
    select coalesce(public.byelarah_data_extenso(min(s.event_at)), '')
      into data_final
      from public.experience_slots s
     where s.experience_id = new.id
       and s.is_active is true
       and s.event_at >= now();
    data_final := coalesce(data_final, '');
  end if;

  motivo_final := case when data_final = '' then 'inscricoes' else 'data' end;

  local_final := nullif(
    btrim(concat_ws(' — ', nullif(btrim(coalesce(new.endereco, '')), ''),
                           nullif(btrim(coalesce(new.bairro, '')), ''))),
    '');

  -- Se existir um item legado apontando pra esta experiência, guarda o
  -- slug dele: a lista de interesse antiga pode estar gravada por slug.
  select i.slug into slug_legado
    from public.byelarah_items i
   where i.experience_id = new.id
   limit 1;

  insert into public.byelarah_date_announcements
    (item_id, experience_id, alvo_id, item_slug, item_nome, data_texto,
     local, horarios, imagem, link, motivo, origem)
  values
    (null,
     new.id,
     new.id,
     coalesce(btrim(slug_legado), ''),
     btrim(new.nome),
     data_final,
     coalesce(local_final, ''),
     to_jsonb(coalesce(new.horarios, '{}'::text[])),
     coalesce(new.imagem, ''),
     'https://elarah.com.br/experiencia.html?id=' || new.id::text,
     motivo_final,
     'trigger')
  on conflict (alvo_id, data_texto) do nothing;

  return new;
end;
$$;

drop trigger if exists experiences_byelarah_aviso_data on public.experiences;
create trigger experiences_byelarah_aviso_data
  after update on public.experiences
  for each row
  execute function public.byelarah_enqueue_aviso_experiencia();

notify pgrst, 'reload schema';

-- =============================================================
-- VERIFICAÇÃO
--   -- Ondas na fila e o andamento de cada uma:
--   select item_nome, data_texto, motivo, status, total_alvo, enviados,
--          observados, pulados, created_at, processed_at
--     from byelarah_date_announcements
--    order by created_at desc;
--
--   -- Teste da regra de "data publicada" (true = dispara):
--   select byelarah_data_definida('Data em breve'),   -- false
--          byelarah_data_definida('24 de abril'),     -- true
--          byelarah_data_definida('12/10'),           -- true
--          byelarah_data_definida('nova data em breve'); -- false
--
--   -- Cancelar uma onda ANTES de ela sair:
--   update byelarah_date_announcements
--      set status = 'cancelado'
--    where id = '<id>' and status = 'pendente';
-- =============================================================
