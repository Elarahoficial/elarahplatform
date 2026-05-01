-- =============================================================
-- ELARAH — Storage bucket pra comprovantes financeiros
-- -------------------------------------------------------------
-- Bucket privado 'financial-attachments' usado por:
--   - financial_expenses.attachment_path        (notas fiscais, recibos)
--   - manual_sales.payout_attachment_path        (comprovantes de repasse)
--
-- Privado = nunca exposto via URL pública. UI usa createSignedUrl()
-- pra gerar URL temporária quando o admin clica em "ver comprovante".
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: public.is_admin().
-- =============================================================

-- ===== BUCKET =====
-- Cria via insert direto em storage.buckets (pattern padrão do
-- Supabase pra criar bucket por SQL). on conflict garante idempotência.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'financial-attachments',
  'financial-attachments',
  false,                                                          -- privado
  10 * 1024 * 1024,                                               -- 10 MB por arquivo
  array['image/png','image/jpeg','image/webp','image/heic','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ===== POLICIES =====
-- Acesso (select/insert/update/delete) restrito a admins via
-- public.is_admin(). Mesma semântica das tabelas financeiras.

drop policy if exists "financial_attachments_admin_select" on storage.objects;
create policy "financial_attachments_admin_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'financial-attachments' and public.is_admin());

drop policy if exists "financial_attachments_admin_insert" on storage.objects;
create policy "financial_attachments_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'financial-attachments' and public.is_admin());

drop policy if exists "financial_attachments_admin_update" on storage.objects;
create policy "financial_attachments_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'financial-attachments' and public.is_admin())
  with check (bucket_id = 'financial-attachments' and public.is_admin());

drop policy if exists "financial_attachments_admin_delete" on storage.objects;
create policy "financial_attachments_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'financial-attachments' and public.is_admin());
