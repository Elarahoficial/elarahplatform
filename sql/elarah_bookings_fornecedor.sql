-- =============================================================
-- ELARAH — Camada financeira do fornecedor nas bookings
-- -------------------------------------------------------------
-- Adiciona colunas de fornecedor, valor cheio, repasse, comissão
-- e status do fornecedor na tabela bookings.
--
-- Rode este arquivo UMA VEZ no SQL Editor do Supabase.
-- Idempotente — pode rodar de novo sem quebrar.
-- =============================================================

-- ===== 1. Colunas do fornecedor =====
alter table public.bookings
  add column if not exists fornecedor_nome text,
  add column if not exists fornecedor_id uuid references auth.users(id) on delete set null,
  add column if not exists valor_cheio_centavos integer,
  add column if not exists valor_repasse_centavos integer,
  add column if not exists valor_comissao_centavos integer,
  add column if not exists status_fornecedor text not null default 'repasse_pendente'
    check (status_fornecedor in ('repasse_pendente', 'repasse_feito'));

-- ===== 2. Indexes =====
create index if not exists bookings_fornecedor_idx
  on public.bookings (fornecedor_nome);
create index if not exists bookings_status_fornecedor_idx
  on public.bookings (status_fornecedor);

-- ===== 3. Backfill: preenche fornecedor_nome de bookings existentes =====
-- Usa experiences.created_by → profiles.nome / partner_data->>'marca'
update public.bookings b
   set fornecedor_nome = coalesce(
         p.partner_data ->> 'marca',
         p.nome,
         'Desconhecido'
       ),
       fornecedor_id = e.created_by
  from public.experiences e
  join public.profiles p on p.id = e.created_by
 where b.experiencia_id = e.id
   and b.fornecedor_nome is null
   and e.created_by is not null;
