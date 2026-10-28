-- Adds a per-website toggle for the "Created by orxai" badge shown on
-- public sites. Defaults to true so existing and newly created sites keep
-- showing the badge until an admin turns it off for a specific site.
alter table public.websites
  add column if not exists show_branding boolean not null default true;
