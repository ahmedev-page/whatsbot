create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  visited_at timestamptz not null default now()
);

create index if not exists site_visits_website_id_idx on public.site_visits (website_id);
create index if not exists site_visits_visited_at_idx on public.site_visits (visited_at);
