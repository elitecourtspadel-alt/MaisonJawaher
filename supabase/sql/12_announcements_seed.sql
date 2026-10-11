-- Seed 08 · Starter announcements for the scrolling bar. Change or switch them off from the admin portal.
insert into public.announcements (id, sort_order) values
  ('20000000-0000-4000-8000-000000000001', 0),
  ('20000000-0000-4000-8000-000000000002', 1),
  ('20000000-0000-4000-8000-000000000003', 2)
on conflict (id) do nothing;

insert into public.announcement_translations (announcement_id, locale, message) values
  ('20000000-0000-4000-8000-000000000001', 'en', 'Pay when your order arrives. Cash on delivery across Morocco.'),
  ('20000000-0000-4000-8000-000000000001', 'fr', 'Payez à la réception de votre commande. Paiement à la livraison partout au Maroc.'),
  ('20000000-0000-4000-8000-000000000002', 'en', 'Questions about a piece? Send us a message on WhatsApp.'),
  ('20000000-0000-4000-8000-000000000002', 'fr', 'Une question sur un bijou ? Écrivez-nous sur WhatsApp.'),
  ('20000000-0000-4000-8000-000000000003', 'en', 'New pieces have just arrived. Take a look.'),
  ('20000000-0000-4000-8000-000000000003', 'fr', 'De nouvelles pièces viennent d’arriver. Venez voir.')
on conflict (announcement_id, locale) do nothing;
