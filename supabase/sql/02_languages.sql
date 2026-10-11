-- 03 · Languages.
-- Wording for categories, products and so on lives in *_translations tables keyed by a language code,
-- so a new language is a new row here (plus a UI dictionary in the app), not a new column everywhere.
create table if not exists public.languages (
  code         text primary key,
  name         text not null,
  native_name  text not null,
  direction    text not null default 'ltr' check (direction in ('ltr','rtl')),
  is_default   boolean not null default false,
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_by   uuid references public.app_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_by   uuid references public.app_users(id) on delete set null,
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_languages_touch on public.languages;
create trigger trg_languages_touch before update on public.languages
  for each row execute function public.touch_updated_at();
