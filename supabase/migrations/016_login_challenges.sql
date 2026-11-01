-- Platform sign-in via WhatsApp verification.
--
-- Flow: the dashboard asks the worker for a challenge (a short one-time code
-- plus an unguessable id the browser keeps). The person sends the code to the
-- bot from their own WhatsApp; the bot marks the challenge verified with that
-- sender's phone number. The browser, polling with its id, then receives a
-- session. The person always starts the conversation, so no outbound
-- template messages are needed.
--
-- status: pending -> verified (bot saw the code) -> consumed (browser took the
-- session). 'expired' is derived from expires_at, never stored.
create table if not exists public.login_challenges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'verified', 'consumed')),
  phone_number text,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified_at timestamptz
);

create index if not exists login_challenges_expires_idx on public.login_challenges (expires_at);
create index if not exists login_challenges_code_pending_idx on public.login_challenges (code) where status = 'pending';

alter table public.login_challenges enable row level security;

do $$
begin
  create policy "backend service role can manage login challenges"
    on public.login_challenges for all to service_role using (true) with check (true);
exception
  when duplicate_object then null;
end $$;
