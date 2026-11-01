create table if not exists public.processed_messages (
  message_id text primary key,
  status text not null default 'processing',
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

alter table public.processed_messages add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.processed_messages add column if not exists attempts integer not null default 0;

alter table public.processed_messages enable row level security;

do $$
begin
  create policy "backend service role can manage processed messages"
    on public.processed_messages for all to service_role using (true) with check (true);
exception
  when duplicate_object then null;
end $$;