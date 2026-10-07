-- 08 · Announcements shown in the scrolling bar under the header.
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.announcement_translations (
  id               uuid primary key default gen_random_uuid(),
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  locale           text not null references public.languages(code) on update cascade,
  message          text not null default '',
  is_active        boolean not null default true,
  created_by       uuid references public.app_users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_by       uuid references public.app_users(id) on delete set null,
  updated_at       timestamptz not null default now(),
  unique (announcement_id, locale)
);

do $$ declare t text; begin
  foreach t in array array['announcements','announcement_translations'] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
