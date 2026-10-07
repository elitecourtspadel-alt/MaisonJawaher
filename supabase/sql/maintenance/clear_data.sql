-- Clears the shop's own data and keeps the setup.
-- Removed:  products, categories, hero slides, FAQs, announcements, orders, messages, audit history.
-- Kept:     admin users, roles, privileges, languages and settings (so you can still sign in).
-- Safe to run more than once. Uploaded images are removed separately by the script.
do $$ declare t text; begin
  foreach t in array array[
    'audit_log','messages','orders',
    'announcement_translations','announcements','faq_translations','faqs','slide_translations','slides',
    'product_section_translations','product_sections','product_image_translations','product_images',
    'product_translations','products','category_translations','categories'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('delete from public.%I', t);
    end if;
  end loop;
end $$;
do $$ begin
  if to_regclass('public.site_settings') is not null then
    update public.site_settings set data = data || '{"hero_background_url":"","hero_background_path":""}'::jsonb;
  end if;
end $$;
