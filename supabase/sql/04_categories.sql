-- 04 · Categories and their translated wording.
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  image_url   text,
  image_path  text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.category_translations (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid not null references public.categories(id) on delete cascade,
  locale           text not null references public.languages(code) on update cascade,
  name             text not null default '',
  description      text not null default '',
  seo_title        text not null default '',
  seo_description  text not null default '',
  is_active        boolean not null default true,
  created_by       uuid references public.app_users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_by       uuid references public.app_users(id) on delete set null,
  updated_at       timestamptz not null default now(),
  unique (category_id, locale)
);

do $$ declare t text; begin
  foreach t in array array['categories','category_translations'] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
