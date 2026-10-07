-- Seed 07 · A few starter questions. Edit them from the admin portal.
insert into public.faqs (id, sort_order) values
  ('10000000-0000-4000-8000-000000000001', 0),
  ('10000000-0000-4000-8000-000000000002', 1),
  ('10000000-0000-4000-8000-000000000003', 2),
  ('10000000-0000-4000-8000-000000000004', 3)
on conflict (id) do nothing;

insert into public.faq_translations (faq_id, locale, question, answer) values
  ('10000000-0000-4000-8000-000000000001', 'en', 'How do I order?', 'Add what you like to the cart and fill in your delivery details. We will call or message you to confirm before anything is sent.'),
  ('10000000-0000-4000-8000-000000000001', 'fr', 'Comment commander ?', 'Ajoutez vos bijoux au panier et remplissez vos informations de livraison. Nous vous appelons ou vous écrivons pour confirmer avant tout envoi.'),
  ('10000000-0000-4000-8000-000000000002', 'en', 'How do I pay?', 'You pay in cash when the parcel is delivered.'),
  ('10000000-0000-4000-8000-000000000002', 'fr', 'Comment payer ?', 'Vous payez en espèces à la réception du colis.'),
  ('10000000-0000-4000-8000-000000000003', 'en', 'How should I look after my jewelry?', 'Keep it away from water, perfume and lotions, wipe it with a soft cloth, and store it in its pouch.'),
  ('10000000-0000-4000-8000-000000000003', 'fr', 'Comment entretenir mes bijoux ?', 'Évitez l’eau, le parfum et les crèmes, essuyez-les avec un chiffon doux et rangez-les dans leur pochette.'),
  ('10000000-0000-4000-8000-000000000004', 'en', 'Can I ask about a piece before ordering?', 'Yes. Message us on WhatsApp or through the contact page and we will get back to you.'),
  ('10000000-0000-4000-8000-000000000004', 'fr', 'Puis-je poser une question avant de commander ?', 'Oui. Écrivez-nous sur WhatsApp ou depuis la page contact, nous vous répondrons.')
on conflict (faq_id, locale) do nothing;
