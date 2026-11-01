insert into public.platform_settings (key, value)
values ('frontend_url', 'https://orxai.pages.dev')
on conflict (key) do update set value = excluded.value;