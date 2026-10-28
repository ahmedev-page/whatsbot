-- Public bucket for images uploaded via WhatsApp (logo, hero, product/service photos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('website-images', 'website-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Explicit public read policy (belt-and-suspenders alongside the bucket's
-- own public flag). Uploads from the Worker use the service-role key, which
-- bypasses RLS entirely, so no insert/update policy is needed here.
drop policy if exists "Public read access for website-images" on storage.objects;
create policy "Public read access for website-images"
on storage.objects for select
to public
using (bucket_id = 'website-images');
