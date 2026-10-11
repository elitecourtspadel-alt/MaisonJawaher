-- Seed 01 · Languages. Add a row here to start translating content into another language.
insert into public.languages (code, name, native_name, direction, is_default, sort_order) values
  ('en', 'English', 'English',  'ltr', false, 1),
  ('fr', 'French',  'Français', 'ltr', true,  0)
on conflict (code) do update set name = excluded.name, native_name = excluded.native_name,
  direction = excluded.direction, is_default = excluded.is_default, sort_order = excluded.sort_order;
