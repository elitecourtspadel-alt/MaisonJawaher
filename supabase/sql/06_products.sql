-- 05 · Products, their translated wording, photos and expandable sections.
-- products.category_id is ON DELETE RESTRICT: a category that still has products cannot be deleted.
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid references public.categories(id) on delete restrict,
  slug           text not null unique,
  sku            text not null default '',
  price          numeric(12,2),
  compare_price  numeric(12,2),
  show_price     boolean not null default true,
  stock          int not null default 0,
  track_stock    boolean not null default false,
  is_featured    boolean not null default false,
  is_new         boolean not null default false,
  weight         text not null default '',
  dimensions     text not null default '',
  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_by     uuid references public.app_users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_by     uuid references public.app_users(id) on delete set null,
  updated_at     timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);

create table if not exists public.product_translations (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.products(id) on delete cascade,
  locale             text not null references public.languages(code) on update cascade,
  name               text not null default '',
  short_description  text not null default '',
  description        text not null default '',
  material           text not null default '',
  seo_title          text not null default '',
  seo_description    text not null default '',
  is_active          boolean not null default true,
  created_by         uuid references public.app_users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_by         uuid references public.app_users(id) on delete set null,
  updated_at         timestamptz not null default now(),
  unique (product_id, locale)
);

create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  path        text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id);

create table if not exists public.product_image_translations (
  id          uuid primary key default gen_random_uuid(),
  image_id    uuid not null references public.product_images(id) on delete cascade,
  locale      text not null references public.languages(code) on update cascade,
  alt_text    text not null default '',
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (image_id, locale)
);

create table if not exists public.product_sections (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.product_section_translations (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references public.product_sections(id) on delete cascade,
  locale      text not null references public.languages(code) on update cascade,
  title       text not null default '',
  body        text not null default '',
  is_active   boolean not null default true,
  created_by  uuid references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.app_users(id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (section_id, locale)
);

do $$ declare t text; begin
  foreach t in array array['products','product_translations','product_images','product_image_translations','product_sections','product_section_translations'] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
