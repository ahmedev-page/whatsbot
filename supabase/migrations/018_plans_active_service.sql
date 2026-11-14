-- Plans + "which service is this person talking about" for the WhatsApp bot.
--
-- plan: 'free' (default) allows ONE published website and ONE interactive
--   service of each type. Any other value lifts those limits (see
--   workers/manfaz-api/src/service-registry.ts → limitsForPlan).
-- active_website_id: the service the bot is currently working on, so a person
--   with several services is not asked "which one?" on every message.

alter table public.users
  add column if not exists plan text not null default 'free';

alter table public.users
  add column if not exists active_website_id uuid references public.websites(id) on delete set null;
