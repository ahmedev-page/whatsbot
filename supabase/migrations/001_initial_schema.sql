create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique not null,
  free_messages_used integer not null default 0,
  free_messages_limit integer not null default 40,
  created_at timestamptz not null default now()
);

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  public_id uuid unique not null default gen_random_uuid(),
  site_name text not null,
  template_id text not null,
  theme_color text not null default '#e56b4e',
  json_structure jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'gemini',
  key_string text not null,
  status text not null default 'active' check (status in ('active', 'disabled')),
  last_used_at timestamptz
);

create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null default ''
);

insert into public.platform_settings (key, value)
values
  ('whatsapp_number', ''),
  ('frontend_url', 'https://manfaz.pages.dev'),
  ('meta_phone_number_id', '')
on conflict (key) do nothing;

alter table public.users enable row level security;
alter table public.websites enable row level security;
alter table public.api_keys enable row level security;
alter table public.platform_settings enable row level security;

create policy "backend service role can manage users"
  on public.users for all to service_role using (true) with check (true);
create policy "backend service role can manage websites"
  on public.websites for all to service_role using (true) with check (true);
create policy "backend service role can manage api keys"
  on public.api_keys for all to service_role using (true) with check (true);
create policy "backend service role can manage settings"
  on public.platform_settings for all to service_role using (true) with check (true);