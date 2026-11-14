-- 019
--  * websites.is_published : pause a service without deleting it. The free plan
--    limits what is PUBLISHED at the same time, so pausing frees the slot.
--  * users.notify_orders   : WhatsApp the owner when a booking/order/response arrives.
--  * announcements         : admin-authored cards shown to users in the dashboard.

alter table public.websites
  add column if not exists is_published boolean not null default true;

alter table public.users
  add column if not exists notify_orders boolean not null default true;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  image_url text,
  link_url text,
  link_label text not null default '',
  theme text not null default 'blue' check (theme in ('blue', 'navy', 'emerald', 'violet', 'amber', 'rose')),
  audience text not null default 'all' check (audience in ('all', 'free', 'paid')),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  views integer not null default 0,
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_active_idx on public.announcements (is_active, sort_order);

alter table public.announcements enable row level security;

do $$ begin
  create policy "backend service role can manage announcements" on public.announcements for all to service_role using (true) with check (true);
exception when duplicate_object then null; end $$;

-- Atomic counters (a read-modify-write from the Worker would lose counts under load).
create or replace function public.bump_announcement(p_id uuid, p_kind text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.announcements
  set views = views + (case when p_kind = 'view' then 1 else 0 end),
      clicks = clicks + (case when p_kind = 'click' then 1 else 0 end)
  where id = p_id;
$$;

revoke all on function public.bump_announcement(uuid, text) from public;
grant execute on function public.bump_announcement(uuid, text) to service_role;
