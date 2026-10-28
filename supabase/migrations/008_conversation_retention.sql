create or replace function public.cleanup_conversation_messages(
  p_keep_count integer default 50
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if p_keep_count < 1 then
    raise exception 'p_keep_count must be positive';
  end if;

  with ranked as (
    select id,
      row_number() over (
        partition by user_id
        order by created_at desc, id desc
      ) as message_number
    from public.conversation_messages
  )
  delete from public.conversation_messages messages
  using ranked
  where messages.id = ranked.id
    and ranked.message_number > p_keep_count;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_conversation_messages(integer) from public;
grant execute on function public.cleanup_conversation_messages(integer) to service_role;