-- Seed 05 · Categories.
insert into public.categories (slug, sort_order) values
  ('rings', 0), ('necklaces', 1), ('earrings', 2), ('bracelets', 3)
on conflict (slug) do nothing;

insert into public.category_translations (category_id, locale, name, description, seo_title, seo_description)
select c.id, v.locale, v.name, v.description, v.seo_title, v.seo_description
from (values
  ('rings',     'en', 'Rings',     'Slim bands and small stone rings for everyday wear.', 'Rings', 'Gold vermeil and silver rings, made in Morocco.'),
  ('rings',     'fr', 'Bagues',    'Anneaux fins et petites bagues serties, à porter tous les jours.', 'Bagues', 'Bagues en vermeil et en argent, faites au Maroc.'),
  ('necklaces', 'en', 'Necklaces', 'Fine chains and small pendants.', 'Necklaces', 'Delicate necklaces and pendants, made in Morocco.'),
  ('necklaces', 'fr', 'Colliers',  'Chaînes fines et petits pendentifs.', 'Colliers', 'Colliers et pendentifs délicats, faits au Maroc.'),
  ('earrings',  'en', 'Earrings',  'Hoops and studs, light enough to forget you are wearing them.', 'Earrings', 'Hoops and stud earrings, made in Morocco.'),
  ('earrings',  'fr', 'Boucles d’oreilles', 'Créoles et clous, assez légers pour les oublier.', 'Boucles d’oreilles', 'Créoles et clous d’oreilles faits au Maroc.'),
  ('bracelets', 'en', 'Bracelets', 'Chain bracelets and open cuffs.', 'Bracelets', 'Chain bracelets and cuffs, made in Morocco.'),
  ('bracelets', 'fr', 'Bracelets', 'Bracelets chaîne et manchettes ouvertes.', 'Bracelets', 'Bracelets chaîne et manchettes faits au Maroc.')
) as v(slug, locale, name, description, seo_title, seo_description)
join public.categories c on c.slug = v.slug
on conflict (category_id, locale) do nothing;
