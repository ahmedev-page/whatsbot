alter table public.users
  add column if not exists pending_build_request text;

alter table public.websites
  add column if not exists username text;

update public.websites
set username = 'site-' || left(replace(public_id::text, '-', ''), 12)
where username is null;

alter table public.websites
  alter column username set not null;

create unique index if not exists websites_username_key
  on public.websites (username);