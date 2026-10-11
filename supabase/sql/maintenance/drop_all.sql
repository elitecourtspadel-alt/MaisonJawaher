-- Drops every table this project creates. Safe to run when some or all of them are missing.
-- Used by "setup-fresh.bat" before it rebuilds everything. Children first, parents last.
drop table if exists public.admin_password_recovery cascade;
drop table if exists public.admin_trusted_devices cascade;
drop table if exists public.admin_login_attempts cascade;
drop function if exists public.record_failed_admin_login(uuid,integer,integer);
drop function if exists public.register_admin_trusted_device(uuid,text,text,text,text,timestamptz,integer,uuid);
drop function if exists public.register_admin_trusted_device(uuid,text,text,text,text,timestamptz,integer,uuid,boolean);
drop function if exists public.prune_admin_trusted_devices(boolean,integer,integer);
drop table if exists public.app_migrations cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.messages cascade;
drop table if exists public.orders cascade;
drop table if exists public.private_settings cascade;
drop table if exists public.site_settings cascade;
drop table if exists public.announcement_translations cascade;
drop table if exists public.announcements cascade;
drop table if exists public.faq_translations cascade;
drop table if exists public.faqs cascade;
drop table if exists public.slide_translations cascade;
drop table if exists public.slides cascade;
drop table if exists public.product_section_translations cascade;
drop table if exists public.product_sections cascade;
drop table if exists public.product_image_translations cascade;
drop table if exists public.product_images cascade;
drop table if exists public.product_translations cascade;
drop table if exists public.products cascade;
drop table if exists public.category_translations cascade;
drop table if exists public.categories cascade;
drop table if exists public.languages cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.role_privileges cascade;
drop table if exists public.roles cascade;
drop table if exists public.privileges cascade;
drop table if exists public.app_users cascade;

-- old versions of this project (before roles and translations existed)
drop table if exists public.admins cascade;

drop function if exists public.product_is_public(uuid);
drop function if exists public.category_is_public(uuid);
drop function if exists public.touch_updated_at();

drop policy if exists "public read media" on storage.objects;
