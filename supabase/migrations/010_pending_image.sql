alter table public.users
  add column if not exists pending_image_url text;
