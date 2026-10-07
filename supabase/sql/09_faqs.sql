-- 07 · Frequently asked questions.
create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.faq_translations (
  id          uuid primary key default gen_random_uuid(),
  faq_id      uuid not null references public.faqs(id) on delete cascade,
  locale      text not null references public.languages(code) on update cascade,
  question    text not null default '',
  answer      text not null default '',
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (faq_id, locale)
);

do $$ declare t text; begin
  foreach t in array array['faqs','faq_translations'] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
