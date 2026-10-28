-- Multiple pending images waiting for placement, in arrival order. Each entry
-- looks like {"url": "...", "receivedAt": "2024-01-01T00:00:00.000Z"}. The
-- existing single-image columns (pending_image_url, pending_image_new_key)
-- are kept as-is for the single-image flow; this column is only used once a
-- second image arrives before the first is placed (batch placement flow).
alter table public.users
  add column if not exists pending_images jsonb not null default '[]'::jsonb;

-- Lets an admin stop the bot from responding to a specific WhatsApp number
-- (spam, abuse) without deleting their account or history.
alter table public.users
  add column if not exists blocked boolean not null default false;

-- Read-state for the admin inbox: a message is unread until an admin opens
-- that user's conversation and it gets fetched.
alter table public.conversation_messages
  add column if not exists is_read boolean not null default false;
alter table public.conversation_messages
  add column if not exists read_at timestamptz;

-- Inbound messages are unread by default; outbound (bot) messages are
-- authored by us, so they don't need a read/unread state — mark them read at
-- insert time going forward via the app layer. Backfill existing outbound
-- rows so old conversations don't show as having unread bot replies.
update public.conversation_messages
set is_read = true, read_at = created_at
where direction = 'outbound' and is_read = false;

create index if not exists conversation_messages_user_unread_idx
  on public.conversation_messages (user_id, is_read)
  where is_read = false;
