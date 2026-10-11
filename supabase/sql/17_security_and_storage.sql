-- 12 · Row level security and image storage.
-- The website reads with the public (anon) key, so these policies decide what visitors can see:
--   * only active rows
--   * a product is visible only if its category is active as well (turn a category off and its products disappear)
--   * translations, photos and sections follow their parent
-- Every other table has no public policy, so only the server (service role) can touch it.
do $$ declare t text; begin
  foreach t in array array[
    'app_users','privileges','roles','role_privileges','user_roles','languages',
    'categories','category_translations','products','product_translations','product_images',
    'product_image_translations','product_sections','product_section_translations',
    'slides','slide_translations','faqs','faq_translations','announcements','announcement_translations',
    'site_settings','private_settings','orders','messages','audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create or replace function public.category_is_public(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select cid is null or exists (select 1 from public.categories c where c.id = cid and c.is_active)
$$;

create or replace function public.product_is_public(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.products p where p.id = pid and p.is_active and public.category_is_public(p.category_id))
$$;

drop policy if exists "public read languages" on public.languages;
create policy "public read languages" on public.languages for select using (is_active);

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (is_active);
drop policy if exists "public read category translations" on public.category_translations;
create policy "public read category translations" on public.category_translations for select
  using (is_active and public.category_is_public(category_id));

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select
  using (is_active and public.category_is_public(category_id));
drop policy if exists "public read product translations" on public.product_translations;
create policy "public read product translations" on public.product_translations for select
  using (is_active and public.product_is_public(product_id));
drop policy if exists "public read product images" on public.product_images;
create policy "public read product images" on public.product_images for select
  using (is_active and public.product_is_public(product_id));
drop policy if exists "public read product image translations" on public.product_image_translations;
create policy "public read product image translations" on public.product_image_translations for select
  using (is_active and exists (select 1 from public.product_images i where i.id = image_id and i.is_active and public.product_is_public(i.product_id)));
drop policy if exists "public read product sections" on public.product_sections;
create policy "public read product sections" on public.product_sections for select
  using (is_active and public.product_is_public(product_id));
drop policy if exists "public read product section translations" on public.product_section_translations;
create policy "public read product section translations" on public.product_section_translations for select
  using (is_active and exists (select 1 from public.product_sections s where s.id = section_id and s.is_active and public.product_is_public(s.product_id)));

drop policy if exists "public read slides" on public.slides;
create policy "public read slides" on public.slides for select using (is_active);
drop policy if exists "public read slide translations" on public.slide_translations;
create policy "public read slide translations" on public.slide_translations for select
  using (is_active and exists (select 1 from public.slides s where s.id = slide_id and s.is_active));

drop policy if exists "public read faqs" on public.faqs;
create policy "public read faqs" on public.faqs for select using (is_active);
drop policy if exists "public read faq translations" on public.faq_translations;
create policy "public read faq translations" on public.faq_translations for select
  using (is_active and exists (select 1 from public.faqs f where f.id = faq_id and f.is_active));

drop policy if exists "public read announcements" on public.announcements;
create policy "public read announcements" on public.announcements for select using (is_active);
drop policy if exists "public read announcement translations" on public.announcement_translations;
create policy "public read announcement translations" on public.announcement_translations for select
  using (is_active and exists (select 1 from public.announcements a where a.id = announcement_id and a.is_active));

-- Image storage: one bucket called "media" (JPG, PNG, WebP, AVIF, up to 8 MB each).
-- Images are served from the public object URL, which Supabase's CDN caches and which bypasses RLS: that keeps the
-- catalogue fast. Everything else is locked down:
--   * there is NO policy on storage.objects for anon or authenticated users, so nobody can list, upload, replace or delete files
--     through the API with the public key; only the server (service role) writes, after checking the admin's privileges
--   * the file names are random UUIDs, so the folders cannot be guessed or enumerated
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

drop policy if exists "public read media" on storage.objects;
