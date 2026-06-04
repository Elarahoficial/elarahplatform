-- =============================================================
-- ELARAH — Storage bucket pra imagens das experiencias
-- -------------------------------------------------------------
-- Bucket publico 'experience-images' usado pra upload direto de
-- fotos das experiencias do admin. Antes o admin so podia colar
-- URL externa, o que causava imagens quebradas (links de Drive/
-- Insta nao funcionam, hotlink protection, 404 silencioso → cai
-- na imagem padrao da categoria e parece que sao todas iguais).
--
-- Publico = qualquer um pode LER (necessario pro site exibir as
-- fotos). Soh admin pode escrever/sobrescrever/apagar.
--
-- IDEMPOTENTE — pode rodar quantas vezes precisar.
-- Depende de: public.is_admin().
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'experience-images',
  'experience-images',
  true,                                                           -- publico (read)
  10 * 1024 * 1024,                                               -- 10 MB por arquivo
  array['image/png','image/jpeg','image/webp','image/heic','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ===== POLICIES =====
-- Read: aberto (qualquer um le, ate anonimo — site publico).
-- Write/Update/Delete: soh admin.

drop policy if exists "experience_images_public_select" on storage.objects;
create policy "experience_images_public_select"
  on storage.objects for select
  to public
  using (bucket_id = 'experience-images');

drop policy if exists "experience_images_admin_insert" on storage.objects;
create policy "experience_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'experience-images' and public.is_admin());

drop policy if exists "experience_images_admin_update" on storage.objects;
create policy "experience_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'experience-images' and public.is_admin())
  with check (bucket_id = 'experience-images' and public.is_admin());

drop policy if exists "experience_images_admin_delete" on storage.objects;
create policy "experience_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'experience-images' and public.is_admin());
