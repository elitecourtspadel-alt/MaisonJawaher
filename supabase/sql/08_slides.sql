-- 06 · Home page slider.
create table if not exists public.slides (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  image_path  text,
  cta_url     text not null default '',
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.slide_translations (
  id          uuid primary key default gen_random_uuid(),
  slide_id    uuid not null references public.slides(id) on delete cascade,
  locale      text not null references public.languages(code) on update cascade,
  title       text not null default '',
  subtitle    text not null default '',
  cta_label   text not null default '',
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (slide_id, locale)
);

do $$ declare t text; begin
  foreach t in array array['slides','slide_translations'] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
