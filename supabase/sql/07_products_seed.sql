-- Seed 06 · Sample products so the shop is not empty. Replace them from the admin portal (prices are examples).
insert into public.products (category_id, slug, sku, price, weight, dimensions, is_featured, is_new, sort_order)
select c.id, v.slug, v.sku, v.price, v.weight, v.dimensions, v.is_featured, v.is_new, v.sort_order
from (values
  ('rings',     'lune-ring',       'MJ-R-001', 450, '2 g',  'Band 2 mm',      true, true,  0),
  ('rings',     'jawhara-ring',    'MJ-R-002', 520, '3 g',  'Stone 5 mm',     true, false, 1),
  ('necklaces', 'atlas-necklace',  'MJ-N-001', 780, '5 g',  'Chain 45 cm',    true, true,  2),
  ('necklaces', 'zahra-pendant',   'MJ-N-002', 640, '4 g',  'Chain 42 cm',    true, false, 3),
  ('earrings',  'sahara-hoops',    'MJ-E-001', 390, '3 g',  'Diameter 25 mm', true, true,  4),
  ('earrings',  'nour-studs',      'MJ-E-002', 290, '1 g',  'Diameter 6 mm',  false, false, 5),
  ('bracelets', 'marrakech-cuff',  'MJ-B-001', 560, '8 g',  'Open, adjustable', true, false, 6),
  ('bracelets', 'safran-bracelet', 'MJ-B-002', 480, '4 g',  'Length 17 to 20 cm', false, true, 7)
) as v(category, slug, sku, price, weight, dimensions, is_featured, is_new, sort_order)
join public.categories c on c.slug = v.category
on conflict (slug) do nothing;

insert into public.product_translations (product_id, locale, name, short_description, description, material, seo_title, seo_description)
select p.id, v.locale, v.name, v.short_description, v.description, v.material, v.name, v.short_description
from (values
  ('lune-ring', 'en', 'Lune Ring', 'A slim band with a small crescent.', 'A thin gold vermeil band with a small crescent moon on top. It is light enough to wear every day and sits well next to other rings.', 'Gold vermeil'),
  ('lune-ring', 'fr', 'Bague Lune', 'Un anneau fin avec un petit croissant.', 'Un anneau fin en vermeil, avec un petit croissant de lune. Assez léger pour tous les jours, et facile à porter avec d’autres bagues.', 'Vermeil'),
  ('jawhara-ring', 'en', 'Jawhara Ring', 'A small round stone in a plain setting.', 'One small round stone in a simple gold setting. Jawhara means jewel in Arabic.', 'Gold vermeil, zircon'),
  ('jawhara-ring', 'fr', 'Bague Jawhara', 'Une petite pierre ronde, sertie simplement.', 'Une petite pierre ronde dans un sertissage doré tout simple. Jawhara veut dire bijou en arabe.', 'Vermeil, zircon'),
  ('atlas-necklace', 'en', 'Atlas Necklace', 'A fine chain with a small peak pendant.', 'A fine chain with a small triangular pendant, a nod to the Atlas mountains. Sits just below the collarbone.', 'Gold vermeil'),
  ('atlas-necklace', 'fr', 'Collier Atlas', 'Une chaîne fine avec un petit pendentif en pointe.', 'Une chaîne fine avec un petit pendentif triangulaire, clin d’œil aux montagnes de l’Atlas. Se pose juste sous la clavicule.', 'Vermeil'),
  ('zahra-pendant', 'en', 'Zahra Pendant', 'A small flower on a thin chain.', 'A small hand-finished flower on a thin chain. Zahra means flower.', 'Sterling silver'),
  ('zahra-pendant', 'fr', 'Pendentif Zahra', 'Une petite fleur sur une chaîne fine.', 'Une petite fleur finie à la main, sur une chaîne fine. Zahra veut dire fleur.', 'Argent 925'),
  ('sahara-hoops', 'en', 'Sahara Hoops', 'Medium hoops with a hammered finish.', 'Medium-sized hoops with a softly hammered surface that catches the light. Light on the ear.', 'Gold vermeil'),
  ('sahara-hoops', 'fr', 'Créoles Sahara', 'Créoles moyennes à la finition martelée.', 'Créoles de taille moyenne, à la surface légèrement martelée qui accroche la lumière. Légères à l’oreille.', 'Vermeil'),
  ('nour-studs', 'en', 'Nour Studs', 'Tiny round studs.', 'Tiny round studs for every day. Nour means light.', 'Sterling silver'),
  ('nour-studs', 'fr', 'Clous Nour', 'De minuscules clous ronds.', 'De minuscules clous ronds, pour tous les jours. Nour veut dire lumière.', 'Argent 925'),
  ('marrakech-cuff', 'en', 'Marrakech Cuff', 'An open cuff with a fine engraved pattern.', 'An open cuff engraved with a fine geometric pattern. The opening can be adjusted gently to fit your wrist.', 'Sterling silver'),
  ('marrakech-cuff', 'fr', 'Manchette Marrakech', 'Une manchette ouverte, gravée d’un motif fin.', 'Une manchette ouverte gravée d’un fin motif géométrique. L’ouverture s’ajuste doucement à votre poignet.', 'Argent 925'),
  ('safran-bracelet', 'en', 'Safran Bracelet', 'A chain bracelet with an adjustable clasp.', 'A fine chain bracelet that fits wrists from 17 to 20 cm thanks to its adjustable clasp.', 'Gold vermeil'),
  ('safran-bracelet', 'fr', 'Bracelet Safran', 'Un bracelet chaîne au fermoir réglable.', 'Un bracelet chaîne fin qui s’adapte aux poignets de 17 à 20 cm grâce à son fermoir réglable.', 'Vermeil')
) as v(slug, locale, name, short_description, description, material)
join public.products p on p.slug = v.slug
on conflict (product_id, locale) do nothing;

-- Two expandable sections on every sample product: care, and delivery
insert into public.product_sections (product_id, sort_order)
select p.id, s.n from public.products p cross join (values (0), (1)) as s(n)
where not exists (select 1 from public.product_sections x where x.product_id = p.id and x.sort_order = s.n);

insert into public.product_section_translations (section_id, locale, title, body)
select s.id, v.locale, v.title, v.body
from public.product_sections s
join (values
  (0, 'en', 'Care', 'Keep it away from water, perfume and lotions. Wipe it with a soft dry cloth after wearing and store it in its pouch.'),
  (0, 'fr', 'Entretien', 'Évitez l’eau, le parfum et les crèmes. Essuyez-le avec un chiffon doux et sec après l’avoir porté, et rangez-le dans sa pochette.'),
  (1, 'en', 'Delivery', 'We deliver across Morocco and you pay when the parcel arrives.'),
  (1, 'fr', 'Livraison', 'Nous livrons partout au Maroc et vous payez à la réception du colis.')
) as v(sort_order, locale, title, body) on v.sort_order = s.sort_order
on conflict (section_id, locale) do nothing;
