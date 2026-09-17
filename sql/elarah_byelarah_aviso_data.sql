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
--   1. Trigger em byelarah_items detecta a TRANSIÇÃO
--      "sem data / oculto" → "com data publicada e ativo".
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
-- 4) Fila de ondas de aviso
-- -------------------------------------------------------------
-- Uma linha = "avisar todo mundo da lista do item X de que a data
-- é Y". A trigger só ENFILEIRA; quem envia é a Edge Function.
-- Separar as duas coisas é o que permite: enviar em lotes, retomar
-- depois de timeout, ver no painel quantos já receberam, e cancelar
-- uma onda antes de ela sair.
create table if not exists public.byelarah_date_announcements (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid references public.byelarah_items(id) on delete cascade,
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

-- A TRAVA. Mesma data do mesmo item = uma onda só, pra sempre.
create unique index if not exists byelarah_date_ann_item_data_uidx
  on public.byelarah_date_announcements (item_id, data_texto);

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
  antes_anunciavel boolean;
  agora_anunciavel boolean;
  data_mudou       boolean;
  link_final       text;
begin
  -- "Anunciável" = está no ar E tem data publicada. O aviso sai quando o
  -- item ENTRA nesse estado ("preenchi a data", "estava oculto com data e
  -- acabei de publicar") ou quando a data publicada MUDA (remarcação: a
  -- lista precisa saber da data nova).
  antes_anunciavel := (old.ativo is true)
                      and public.byelarah_data_definida(old.data);
  agora_anunciavel := (new.ativo is true)
                      and public.byelarah_data_definida(new.data);
  data_mudou := btrim(coalesce(old.data, '')) is distinct from btrim(coalesce(new.data, ''));

  if not agora_anunciavel then
    return new;
  end if;
  -- Já era anunciável com a MESMA data → é uma edição qualquer (local,
  -- horário, preço, ordem). Não avisa ninguém.
  if antes_anunciavel and not data_mudou then
    return new;
  end if;

  -- Chave por item (a admin pode desligar o automático).
  if new.avisar_interessados is not true then
    return new;
  end if;

  -- Sem slug não dá pra saber com segurança QUEM é a lista desse
  -- item — e mandar pra lista errada é o pior resultado possível.
  if coalesce(btrim(new.slug), '') = '' then
    return new;
  end if;

  -- Link da mensagem: override manual > checkout da experiência
  -- vinculada > âncora do card na home.
  link_final := nullif(btrim(coalesce(new.link_inscricao, '')), '');
  if link_final is null and new.experience_id is not null then
    link_final := 'https://elarah.com.br/experiencia.html?id=' || new.experience_id::text;
  end if;
  if link_final is null then
    link_final := 'https://elarah.com.br/index.html#by-elarah-' || new.slug;
  end if;

  insert into public.byelarah_date_announcements
    (item_id, item_slug, item_nome, data_texto, local, horarios, imagem, link, origem)
  values
    (new.id,
     btrim(new.slug),
     btrim(new.nome),
     btrim(new.data),
     coalesce(new.local, ''),
     coalesce(new.horarios, '[]'::jsonb),
     coalesce(new.imagem, ''),
     link_final,
     'trigger')
  on conflict (item_id, data_texto) do nothing;

  return new;
end;
$$;

-- SÓ UPDATE, de propósito (ver "TRAVAS" no topo).
drop trigger if exists byelarah_items_aviso_data on public.byelarah_items;
create trigger byelarah_items_aviso_data
  after update on public.byelarah_items
  for each row
  execute function public.byelarah_enqueue_aviso_data();

notify pgrst, 'reload schema';

-- =============================================================
-- VERIFICAÇÃO
--   -- Ondas na fila e o andamento de cada uma:
--   select item_nome, data_texto, status, total_alvo, enviados,
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
