-- 09 · Site settings (public) and private settings (email switches). Each has one row, edited from the portal.
-- The mail server itself (SMTP host, user, password, sender) is NOT stored here: it comes from the environment (.env.local).
create table if not exists public.site_settings (
  id          int primary key default 1 check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.private_settings (
  id          int primary key default 1 check (id = 1),
  -- { enabled, notify_admin, notify_customer, admin_email, admin_locale }. Private: only the server (service role) can read it.
  email       jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['site_settings','private_settings'] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Add the security default to existing settings without replacing customized values.
update public.site_settings set data = '{"admin_trusted_devices_enabled":true,"admin_trusted_device_days":30,"admin_max_trusted_devices":2,"admin_max_failed_logins":5,"admin_lockout_minutes":15}'::jsonb || data where id=1;
update public.site_settings
set data = jsonb_set(data, '{admin_idle_timeout_minutes}', '30'::jsonb)
where id = 1 and not (data ? 'admin_idle_timeout_minutes');

-- Missing price preferences default to hidden; preserve an explicit admin choice.
update public.site_settings
set data = jsonb_set(data, '{show_prices}', 'false'::jsonb)
where id = 1 and not (data ? 'show_prices');
