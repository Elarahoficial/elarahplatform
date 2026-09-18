-- =============================================================
-- ELARAH — Desconto geral (promoção do site inteiro)
-- -------------------------------------------------------------
-- Um percentual que vale pra TODAS as experiências ao mesmo tempo,
-- com validade. Controlado pela aba "Desconto geral" do admin —
-- sem deploy, sem mexer no preço de nenhuma experiência.
--
--     preço promocional = PREÇO DO SITE - percentual%
--
-- O preço cadastrado em experiences.preco NÃO é alterado. O desconto
-- é aplicado na hora: na vitrine (promo.js) e na cobrança
-- (_shared/promo.ts, chamado pelo booking_guard e pelo Stripe).
-- Acabou a validade, tudo volta ao preço normal sozinho.
--
-- LINHA ÚNICA: a tabela tem no máximo uma linha (id = 1). Não é uma
-- lista de campanhas — é o interruptor do site. Histórico de quem
-- mexeu fica em updated_by/updated_at.
--
-- POR QUE ANON PODE LER: a vitrine precisa saber o desconto antes de
-- desenhar qualquer preço, e ela roda deslogada. A linha não tem nada
-- sensível — é exatamente o que o banner anuncia na tela.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- =============================================================

create table if not exists public.desconto_geral (
  id            smallint primary key default 1 check (id = 1),

  -- Interruptor. false = site volta ao preço normal na hora, sem
  -- precisar mexer nas datas.
  ativo         boolean not null default false,

  -- Percentual sobre o preço do site. 20 = 20% OFF.
  -- Teto de 90% é trava contra dedo escorregado (digitar 200 e vender
  -- de graça). Pra passar disso, é mudança consciente aqui.
  percentual    integer not null default 0 check (percentual >= 0 and percentual <= 90),

  -- Janela de validade. Fora dela o desconto não vale, mesmo com
  -- ativo = true.
  inicio        timestamptz not null default now(),
  fim           timestamptz not null default now(),

  -- Textos do aviso no topo do site. NULL/'' = o site monta sozinho
  -- a partir do percentual e da data de fim ("20% OFF em todas as
  -- experiências" / "Só até domingo (20/09), meia-noite").
  titulo        text,
  subtitulo     text,

  -- Auditoria
  updated_by    uuid references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Linha única já criada — assim o admin sempre tem o que editar
-- (update), nunca precisa decidir entre insert e update.
--
-- Nasce com a campanha que já estava combinada: 20% OFF até domingo,
-- 20/09, 23h59. Assim subir esta migração não desliga a promoção que
-- já estava no ar. O `on conflict do nothing` garante que rodar o
-- arquivo de novo NUNCA sobrescreve o que a admin configurou depois.
insert into public.desconto_geral (id, ativo, percentual, inicio, fim)
values (1, true, 20, now(), timestamptz '2026-09-20 23:59:59-03')
on conflict (id) do nothing;

-- Trigger updated_at — helper já existente em elarah_extensions.sql
drop trigger if exists trg_desconto_geral_updated_at on public.desconto_geral;
create trigger trg_desconto_geral_updated_at
  before update on public.desconto_geral
  for each row execute function public.set_updated_at();

-- =========================================================
-- RLS
-- =========================================================
alter table public.desconto_geral enable row level security;

-- Leitura pública: a vitrine (deslogada) precisa do desconto antes de
-- desenhar preço. Só leitura — anon não escreve nada aqui.
drop policy if exists "desconto_geral_read_all" on public.desconto_geral;
create policy "desconto_geral_read_all"
  on public.desconto_geral for select
  to anon, authenticated
  using (true);

-- Escrita: só admin.
drop policy if exists "desconto_geral_admin_write" on public.desconto_geral;
create policy "desconto_geral_admin_write"
  on public.desconto_geral for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
