-- Seed 02 · Privileges: everything an admin can be allowed to do.
-- Actions: view (see only), add, update, toggle (turn active / inactive), delete.
insert into public.privileges (module, action, code, name, description) values
  ('dashboard', 'view', 'dashboard.view', 'View dashboard', 'Can open the dashboard screens and read everything there, but cannot change anything.'),
  ('products', 'view', 'products.view', 'View products', 'Can open the products screens and read everything there, but cannot change anything.'),
  ('products', 'add', 'products.add', 'Add products', 'Can create new products.'),
  ('products', 'update', 'products.update', 'Change products', 'Can edit existing products.'),
  ('products', 'toggle', 'products.toggle', 'Turn products on or off', 'Can make products active or inactive. Inactive items are hidden from the website.'),
  ('products', 'delete', 'products.delete', 'Delete products', 'Can permanently delete products.'),
  ('categories', 'view', 'categories.view', 'View categories', 'Can open the categories screens and read everything there, but cannot change anything.'),
  ('categories', 'add', 'categories.add', 'Add categories', 'Can create new categories.'),
  ('categories', 'update', 'categories.update', 'Change categories', 'Can edit existing categories.'),
  ('categories', 'toggle', 'categories.toggle', 'Turn categories on or off', 'Can make categories active or inactive. Inactive items are hidden from the website.'),
  ('categories', 'delete', 'categories.delete', 'Delete categories', 'Can permanently delete categories.'),
  ('slides', 'view', 'slides.view', 'View hero slides', 'Can open the hero slides screens and read everything there, but cannot change anything.'),
  ('slides', 'add', 'slides.add', 'Add hero slides', 'Can create new hero slides.'),
  ('slides', 'update', 'slides.update', 'Change hero slides', 'Can edit existing hero slides.'),
  ('slides', 'toggle', 'slides.toggle', 'Turn hero slides on or off', 'Can make hero slides active or inactive. Inactive items are hidden from the website.'),
  ('slides', 'delete', 'slides.delete', 'Delete hero slides', 'Can permanently delete hero slides.'),
  ('faqs', 'view', 'faqs.view', 'View FAQs', 'Can open the FAQs screens and read everything there, but cannot change anything.'),
  ('faqs', 'add', 'faqs.add', 'Add FAQs', 'Can create new FAQs.'),
  ('faqs', 'update', 'faqs.update', 'Change FAQs', 'Can edit existing FAQs.'),
  ('faqs', 'toggle', 'faqs.toggle', 'Turn FAQs on or off', 'Can make FAQs active or inactive. Inactive items are hidden from the website.'),
  ('faqs', 'delete', 'faqs.delete', 'Delete FAQs', 'Can permanently delete FAQs.'),
  ('announcements', 'view', 'announcements.view', 'View announcements', 'Can open the announcements screens and read everything there, but cannot change anything.'),
  ('announcements', 'add', 'announcements.add', 'Add announcements', 'Can create new announcements.'),
  ('announcements', 'update', 'announcements.update', 'Change announcements', 'Can edit existing announcements.'),
  ('announcements', 'toggle', 'announcements.toggle', 'Turn announcements on or off', 'Can make announcements active or inactive. Inactive items are hidden from the website.'),
  ('announcements', 'delete', 'announcements.delete', 'Delete announcements', 'Can permanently delete announcements.'),
  ('orders', 'view', 'orders.view', 'View orders', 'Can open the orders screens and read everything there, but cannot change anything.'),
  ('orders', 'update', 'orders.update', 'Change orders', 'Can edit existing orders.'),
  ('orders', 'delete', 'orders.delete', 'Delete orders', 'Can permanently delete orders.'),
  ('messages', 'view', 'messages.view', 'View messages', 'Can open the messages screens and read everything there, but cannot change anything.'),
  ('messages', 'update', 'messages.update', 'Change messages', 'Can edit existing messages.'),
  ('messages', 'delete', 'messages.delete', 'Delete messages', 'Can permanently delete messages.'),
  ('settings', 'view', 'settings.view', 'View settings', 'Can open the settings screens and read everything there, but cannot change anything.'),
  ('settings', 'update', 'settings.update', 'Change settings', 'Can edit existing settings.'),
  ('audit', 'view', 'audit.view', 'View the audit history', 'Can open the the audit history screens and read everything there, but cannot change anything.')
on conflict (code) do update set name = excluded.name, description = excluded.description;

-- Seed 03 · Roles. The ids are fixed so the create-admin script and the app can refer to them.
insert into public.roles (id, code, name, description) values
  ('00000000-0000-4000-8000-000000000001', 'super_admin',    'Super Administrator', 'Can do everything, including reading the audit history and changing settings.'),
  ('00000000-0000-4000-8000-000000000002', 'store_manager',  'Store Manager',       'Runs the shop day to day: catalogue, orders, messages and announcements. Can read settings but not change them.'),
  ('00000000-0000-4000-8000-000000000003', 'content_editor', 'Content Editor',      'Writes and updates catalogue and website content. Cannot delete anything.'),
  ('00000000-0000-4000-8000-000000000004', 'order_handler',  'Order Handler',       'Looks after orders and customer messages. Can look at products but not change them.'),
  ('00000000-0000-4000-8000-000000000005', 'viewer',         'Viewer',              'Can look at the catalogue, orders and messages but cannot change anything.')
on conflict (code) do update set name = excluded.name, description = excluded.description;

-- Seed 04 · Which privileges each role has.

-- Super Administrator: everything
insert into public.role_privileges (role_id, privilege_id)
select r.id, p.id from public.roles r cross join public.privileges p
where r.code = 'super_admin'
on conflict (role_id, privilege_id) do nothing;

-- Store Manager: all catalogue, order and message work, announcements, plus read-only settings
insert into public.role_privileges (role_id, privilege_id)
select r.id, p.id from public.roles r join public.privileges p
  on p.module in ('dashboard','products','categories','slides','faqs','announcements','orders','messages')
  or p.code = 'settings.view'
where r.code = 'store_manager'
on conflict (role_id, privilege_id) do nothing;

-- Content Editor: view, add, update and turn on/off for content. No delete.
insert into public.role_privileges (role_id, privilege_id)
select r.id, p.id from public.roles r join public.privileges p
  on p.code = 'dashboard.view'
  or (p.module in ('products','categories','slides','faqs','announcements') and p.action <> 'delete')
where r.code = 'content_editor'
on conflict (role_id, privilege_id) do nothing;

-- Order Handler: orders and messages (no delete), look at products
insert into public.role_privileges (role_id, privilege_id)
select r.id, p.id from public.roles r join public.privileges p
  on p.code in ('dashboard.view','products.view','orders.view','orders.update','messages.view','messages.update')
where r.code = 'order_handler'
on conflict (role_id, privilege_id) do nothing;

-- Viewer: look but don't touch (no settings or audit history)
insert into public.role_privileges (role_id, privilege_id)
select r.id, p.id from public.roles r join public.privileges p
  on p.action = 'view' and p.module not in ('settings','audit')
where r.code = 'viewer'
on conflict (role_id, privilege_id) do nothing;
