-- 10 · Things customers send us: orders and contact messages.
-- created_by stays empty for these because a customer or visitor created them, not an admin.
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  number      bigint generated always as identity,
  name        text not null,
  phone       text not null,
  email       text not null default '',
  city        text not null,
  address     text not null,
  notes       text not null default '',
  items       jsonb not null default '[]'::jsonb,
  total       numeric(12,2),
  status      text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled')),
  locale      text not null default 'en',
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text not null default '',
  subject     text not null default '',
  body        text not null,
  locale      text not null default 'en',
  is_read     boolean not null default false,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['orders','messages'] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
