-- =============================================================
-- ELARAH — Centralizar WhatsApp do fornecedor em
-- public.fornecedores_metadata (1 fonte da verdade).
-- -------------------------------------------------------------
-- Antes: cada experiência guardava seu próprio fornecedor_whatsapp.
-- Problema: duplicação — se o fornecedor mudava o número, era
-- preciso editar todas as experiências. Pediu pra centralizar.
--
-- Depois: o WhatsApp fica em fornecedores_metadata.whatsapp,
-- vinculado por fornecedor_key (nome lowercased + colapsado). O
-- admin edita 1 vez no painel Fornecedores e o botão "Avisar"
-- em Compras puxa automaticamente.
--
-- Idempotente. Rode UMA VEZ no SQL Editor do Supabase.
-- =============================================================

-- ===== 1. Coluna whatsapp em fornecedores_metadata =====
alter table public.fornecedores_metadata
  add column if not exists whatsapp text;

-- ===== 2. Migração: copia experiences.fornecedor_whatsapp =====
-- Roda só se a coluna ainda existe (em ambientes antigos pode
-- não ter sido criada). DO block usa exception pra ser idempotente.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'experiences'
       and column_name  = 'fornecedor_whatsapp'
  ) then
    insert into public.fornecedores_metadata (fornecedor_key, fornecedor_nome, whatsapp)
    select
      lower(trim(regexp_replace(e.fornecedor_nome, '\s+', ' ', 'g'))) as fornecedor_key,
      e.fornecedor_nome,
      max(e.fornecedor_whatsapp) as whatsapp
    from public.experiences e
    where e.fornecedor_nome is not null
      and trim(e.fornecedor_nome) <> ''
      and e.fornecedor_whatsapp is not null
      and trim(e.fornecedor_whatsapp) <> ''
    group by lower(trim(regexp_replace(e.fornecedor_nome, '\s+', ' ', 'g'))), e.fornecedor_nome
    on conflict (fornecedor_key) do update
      set whatsapp = coalesce(
        nullif(trim(public.fornecedores_metadata.whatsapp), ''),
        excluded.whatsapp
      );
  end if;
end $$;

-- ===== 3. Remove a coluna duplicada de experiences =====
-- Só roda se existir. Depois da migração acima, ela já não
-- é fonte de verdade — pode sair.
alter table public.experiences
  drop column if exists fornecedor_whatsapp;

-- ===== Diagnóstico (opcional) =====
-- select fornecedor_nome, whatsapp
--   from public.fornecedores_metadata
--  where whatsapp is not null
--  order by fornecedor_nome;
