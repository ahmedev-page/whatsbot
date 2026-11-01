-- Adds persistent trusted devices support and performance indexes for platform operations.

alter table public.users
  add column if not exists trusted_devices jsonb not null default '[]'::jsonb;

alter table public.login_challenges
  add column if not exists device_id text;

create index if not exists websites_user_updated_idx
  on public.websites (user_id, updated_at desc);

create index if not exists login_challenges_code_pending_idx
  on public.login_challenges (code)
  where status = 'pending';

alter table public.site_visits enable row level security;
alter table public.login_challenges enable row level security;

do $$
begin
  create policy "backend service role can manage site visits"
    on public.site_visits for all to service_role using (true) with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "backend service role can manage login challenges"
    on public.login_challenges for all to service_role using (true) with check (true);
exception
  when duplicate_object then null;
end $$;
