create or replace function public.consume_message_quota(p_user_id uuid)
returns setof public.users
language sql
security definer
set search_path = public
as $$
  update public.users
  set free_messages_used = free_messages_used + 1
  where id = p_user_id
    and free_messages_used < free_messages_limit
  returning *;
$$;

create or replace function public.claim_processed_message(
  p_message_id text,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.processed_messages (message_id, status, payload, attempts)
  values (p_message_id, 'processing', p_payload, 1)
  on conflict (message_id) do update
    set status = 'processing',
        payload = excluded.payload,
        attempts = public.processed_messages.attempts + 1,
        last_error = null
    where public.processed_messages.status <> 'processed';
  return found;
end;
$$;

revoke all on function public.consume_message_quota(uuid) from public;
revoke all on function public.claim_processed_message(text, jsonb) from public;
grant execute on function public.consume_message_quota(uuid) to service_role;
grant execute on function public.claim_processed_message(text, jsonb) to service_role;