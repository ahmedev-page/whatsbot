create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  visited_at timestamptz not null default now()
);

create index if not exists site_visits_website_id_idx on public.site_visits (website_id);
create index if not exists site_visits_visited_at_idx on public.site_visits (visited_at);

alter table public.site_visits enable row level security;

do $$
begin
  create policy "backend service role can manage site visits"
    on public.site_visits for all to service_role using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

