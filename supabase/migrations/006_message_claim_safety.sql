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
        received_at = now(),
        last_error = null
    where public.processed_messages.status = 'failed'
       or (
         public.processed_messages.status = 'processing'
         and public.processed_messages.received_at < now() - interval '10 minutes'
       );
  return found;
end;
$$;

revoke all on function public.claim_processed_message(text, jsonb) from public;
grant execute on function public.claim_processed_message(text, jsonb) to service_role;