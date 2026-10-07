-- 00 · Base: extensions and helpers shared by every table.
--
-- Every table in this project carries the same five tracking columns:
--   is_active   switch to turn a row on or off (inactive rows are hidden from the public site)
--   created_by  the admin user who created the row
--   created_at  when it was created
--   updated_by  the admin user who last changed it
--   updated_at  when it was last changed (kept up to date by the trigger below)
create extension if not exists pgcrypto;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- 01 · Admin users. One row per person who can sign in to the admin portal.
-- The id is the same as the Supabase Auth user id. Passwords and 2FA are kept by Supabase Auth.
create table if not exists public.app_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null default '',
  is_active   boolean not null default true,
  mfa_required boolean not null default false,
  password_change_required boolean not null default false,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

-- Non-destructive upgrades for existing installations.
alter table public.app_users add column if not exists mfa_required boolean not null default false;
alter table public.app_users add column if not exists password_change_required boolean not null default false;

drop trigger if exists trg_app_users_touch on public.app_users;
create trigger trg_app_users_touch before update on public.app_users
  for each row execute function public.touch_updated_at();


-- Private, short-lived recovery credentials. Never readable by public/authenticated clients.
create table if not exists public.admin_password_recovery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.app_users(id) on delete cascade,
  temp_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  grant_hash text,
  claimed_at timestamptz,
  completed_at timestamptz
);
alter table public.admin_password_recovery enable row level security;
revoke all on public.admin_password_recovery from anon, authenticated;
grant all on public.admin_password_recovery to service_role;

create or replace function public.reserve_admin_recovery(p_user_id uuid, p_temp_hash text, p_expires_at timestamptz)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if exists (select 1 from public.admin_password_recovery where user_id=p_user_id and created_at > now() - interval '5 minutes') then return false; end if;
  insert into public.admin_password_recovery(user_id,temp_hash,expires_at) values(p_user_id,p_temp_hash,p_expires_at)
  on conflict(user_id) do update set id=gen_random_uuid(), temp_hash=excluded.temp_hash, expires_at=excluded.expires_at, created_at=now(), redeemed_at=null, grant_hash=null, claimed_at=null, completed_at=null;
  return true;
end; $$;
revoke all on function public.reserve_admin_recovery(uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_admin_recovery(uuid,text,timestamptz) to service_role;

-- Browser trust is a second-factor shortcut, never a password/session replacement.
create table if not exists public.admin_trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  factor_id text not null,
  security_stamp text not null,
  device_name text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists admin_trusted_devices_user_idx on public.admin_trusted_devices(user_id);
alter table public.admin_trusted_devices enable row level security;
revoke all on public.admin_trusted_devices from anon, authenticated;
grant all on public.admin_trusted_devices to service_role;

-- Serialize concurrent enrollments so the per-admin cap cannot be exceeded.
drop function if exists public.register_admin_trusted_device(uuid,text,text,text,text,timestamptz,integer,uuid);
create or replace function public.register_admin_trusted_device(p_user_id uuid,p_token_hash text,p_factor_id text,p_security_stamp text,p_device_name text,p_expires_at timestamptz,p_max_devices integer,p_replace_id uuid,p_replace_oldest boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare device_id uuid; oldest_name text;
begin
  if p_max_devices < 1 or p_max_devices > 10 or p_expires_at <= now() or p_expires_at > now() + interval '91 days' then raise exception 'Invalid trusted device policy'; end if;
  perform pg_advisory_xact_lock(hashtextextended('trusted:' || p_user_id::text, 0));
  if not exists(select 1 from public.app_users where id=p_user_id and is_active and not password_change_required) then raise exception 'Account is not ready'; end if;
  delete from public.admin_trusted_devices where user_id=p_user_id and (expires_at <= now() or security_stamp <> p_security_stamp or factor_id <> p_factor_id);
  if not p_replace_oldest and (select count(*) from public.admin_trusted_devices where user_id=p_user_id and id is distinct from p_replace_id) >= p_max_devices then
    select device_name into oldest_name from public.admin_trusted_devices where user_id=p_user_id and id is distinct from p_replace_id order by last_used_at,id limit 1;
    return jsonb_build_object('limit',true,'name',oldest_name,'max',p_max_devices);
  end if;
  delete from public.admin_trusted_devices where user_id=p_user_id and id=p_replace_id;
  insert into public.admin_trusted_devices(user_id,token_hash,factor_id,security_stamp,device_name,expires_at) values(p_user_id,p_token_hash,p_factor_id,p_security_stamp,p_device_name,p_expires_at) returning id into device_id;
  delete from public.admin_trusted_devices where user_id=p_user_id and id not in (
    select id from public.admin_trusted_devices where user_id=p_user_id order by (id=device_id) desc,last_used_at desc,id desc limit p_max_devices
  );
  return jsonb_build_object('id',device_id);
end; $$;
revoke all on function public.register_admin_trusted_device(uuid,text,text,text,text,timestamptz,integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.register_admin_trusted_device(uuid,text,text,text,text,timestamptz,integer,uuid,boolean) to service_role;

-- Wrong-password lockout. Kept apart from app_users on purpose: changing app_users would change the security stamp
-- that trusted devices depend on, so a failed sign-in must never touch that row.
create table if not exists public.admin_login_attempts (
  user_id        uuid primary key references public.app_users(id) on delete cascade,
  failed_count   integer not null default 0,
  last_failed_at timestamptz,
  locked_until   timestamptz
);
alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_login_attempts from anon, authenticated;

-- Counts one wrong password atomically. Returns the time the account is locked until, or null if it is not locked.
-- Failures older than the lockout period are forgotten; reaching the limit locks the account for p_minutes.
create or replace function public.record_failed_admin_login(p_user_id uuid, p_max integer, p_minutes integer)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare cur public.admin_login_attempts; cnt integer; lock_until timestamptz;
begin
  if p_max < 1 or p_max > 20 or p_minutes < 1 or p_minutes > 1440 then raise exception 'Invalid lockout policy'; end if;
  perform pg_advisory_xact_lock(hashtextextended('login:' || p_user_id::text, 0));
  select * into cur from public.admin_login_attempts where user_id = p_user_id;
  if found and cur.locked_until is not null and cur.locked_until > now() then return cur.locked_until; end if;
  cnt := case when found and cur.last_failed_at is not null and cur.last_failed_at > now() - make_interval(mins => p_minutes) then cur.failed_count + 1 else 1 end;
  lock_until := case when cnt >= p_max then now() + make_interval(mins => p_minutes) end;
  insert into public.admin_login_attempts(user_id, failed_count, last_failed_at, locked_until)
  values (p_user_id, case when lock_until is null then cnt else 0 end, case when lock_until is null then now() end, lock_until)
  on conflict (user_id) do update set failed_count = excluded.failed_count, last_failed_at = excluded.last_failed_at, locked_until = excluded.locked_until;
  return lock_until;
end; $$;
revoke all on function public.record_failed_admin_login(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.record_failed_admin_login(uuid,integer,integer) to service_role;

create or replace function public.prune_admin_trusted_devices(p_enabled boolean,p_days integer,p_max_devices integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_days < 1 or p_days > 90 or p_max_devices < 1 or p_max_devices > 10 then raise exception 'Invalid trusted device policy'; end if;
  delete from public.admin_trusted_devices where not p_enabled or expires_at <= now() or created_at + make_interval(days => p_days) <= now();
  delete from public.admin_trusted_devices where id in (
    select id from (select id,row_number() over(partition by user_id order by last_used_at desc,id desc) as position from public.admin_trusted_devices) ranked where position > p_max_devices
  );
end; $$;
revoke all on function public.prune_admin_trusted_devices(boolean,integer,integer) from public,anon,authenticated;
grant execute on function public.prune_admin_trusted_devices(boolean,integer,integer) to service_role;

-- 02 · Roles and privileges.
--   privileges       one row per thing an admin can do, for example products.add
--   roles            named bundles of privileges, for example "Content Editor"
--   role_privileges  which privileges each role has
--   user_roles       which roles each admin user has (a user can have several)
create table if not exists public.privileges (
  id           uuid primary key default gen_random_uuid(),
  module       text not null,
  action       text not null check (action in ('view','add','update','toggle','delete')),
  code         text not null unique,
  name         text not null,
  description  text not null default '',
  is_active    boolean not null default true,
  created_by   uuid references public.app_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_by   uuid references public.app_users(id) on delete set null,
  updated_at   timestamptz not null default now()
);

create table if not exists public.roles (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name         text not null,
  description  text not null default '',
  is_active    boolean not null default true,
  created_by   uuid references public.app_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_by   uuid references public.app_users(id) on delete set null,
  updated_at   timestamptz not null default now()
);

create table if not exists public.role_privileges (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null references public.roles(id) on delete cascade,
  privilege_id  uuid not null references public.privileges(id) on delete cascade,
  is_active     boolean not null default true,
  created_by    uuid references public.app_users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_by    uuid references public.app_users(id) on delete set null,
  updated_at    timestamptz not null default now(),
  unique (role_id, privilege_id)
);

create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.app_users(id) on delete cascade,
  role_id     uuid not null references public.roles(id) on delete cascade,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (user_id, role_id)
);

do $$ declare t text; begin
  foreach t in array array['privileges','roles','role_privileges','user_roles'] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
