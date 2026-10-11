import { randomUUID } from 'node:crypto';
import { ALL_PRIVILEGES, MODULES, ROLE_RULES } from '../access';
import { defaultEmailSettings, defaultSettings } from '../settings-defaults';

/** Test-mode sample data. Mirrors supabase/sql/*_seed.sql. */
type Row = Record<string, any>;
export type DB = Record<string, Row[]>;

export const ROLE_IDS = {
  super_admin: '00000000-0000-4000-8000-000000000001',
  store_manager: '00000000-0000-4000-8000-000000000002',
  content_editor: '00000000-0000-4000-8000-000000000003',
  order_handler: '00000000-0000-4000-8000-000000000004',
  viewer: '00000000-0000-4000-8000-000000000005',
} as const;

const now = () => new Date().toISOString();
const track = () => ({ is_active: true, created_by: null, created_at: now(), updated_by: null, updated_at: now() });

const verbs: Record<string, (n: string) => [string, string]> = {
  view: (n) => [`View ${n}`, `Can open the ${n} screens and read everything there, but cannot change anything.`],
  add: (n) => [`Add ${n}`, `Can create new ${n}.`],
  update: (n) => [`Change ${n}`, `Can edit existing ${n}.`],
  toggle: (n) => [`Turn ${n} on or off`, `Can make ${n} active or inactive. Inactive items are hidden from the website.`],
  delete: (n) => [`Delete ${n}`, `Can permanently delete ${n}.`],
};

const roles = [
  ['super_admin', 'Super Administrator', 'Can do everything, including reading the audit history and changing settings.'],
  ['store_manager', 'Store Manager', 'Runs the shop day to day: catalogue, orders, messages and announcements. Can read settings but not change them.'],
  ['content_editor', 'Content Editor', 'Writes and updates catalogue and website content. Cannot delete anything.'],
  ['order_handler', 'Order Handler', 'Looks after orders and customer messages. Can look at products but not change them.'],
  ['viewer', 'Viewer', 'Can look at the catalogue, orders and messages but cannot change anything.'],
] as const;

const categories: [string, string, string, string, string][] = [
  ['rings', 'Rings', 'Bagues', 'Slim bands and small stone rings for everyday wear.', 'Anneaux fins et petites bagues serties, à porter tous les jours.'],
  ['necklaces', 'Necklaces', 'Colliers', 'Fine chains and small pendants.', 'Chaînes fines et petits pendentifs.'],
  ['earrings', 'Earrings', 'Boucles d’oreilles', 'Hoops and studs, light enough to forget you are wearing them.', 'Créoles et clous, assez légers pour les oublier.'],
  ['bracelets', 'Bracelets', 'Bracelets', 'Chain bracelets and open cuffs.', 'Bracelets chaîne et manchettes ouvertes.'],
];

// slug, category, sku, price, weight, dimensions, featured, new, [en name, short, desc, material], [fr ...]
const products: [string, string, string, number, string, string, boolean, boolean, string[], string[]][] = [
  ['lune-ring', 'rings', 'MJ-R-001', 450, '2 g', 'Band 2 mm', true, true,
    ['Lune Ring', 'A slim band with a small crescent.', 'A thin gold vermeil band with a small crescent moon on top. It is light enough to wear every day and sits well next to other rings.', 'Gold vermeil'],
    ['Bague Lune', 'Un anneau fin avec un petit croissant.', 'Un anneau fin en vermeil, avec un petit croissant de lune. Assez léger pour tous les jours, et facile à porter avec d’autres bagues.', 'Vermeil']],
  ['jawhara-ring', 'rings', 'MJ-R-002', 520, '3 g', 'Stone 5 mm', true, false,
    ['Jawhara Ring', 'A small round stone in a plain setting.', 'One small round stone in a simple gold setting. Jawhara means jewel in Arabic.', 'Gold vermeil, zircon'],
    ['Bague Jawhara', 'Une petite pierre ronde, sertie simplement.', 'Une petite pierre ronde dans un sertissage doré tout simple. Jawhara veut dire bijou en arabe.', 'Vermeil, zircon']],
  ['atlas-necklace', 'necklaces', 'MJ-N-001', 780, '5 g', 'Chain 45 cm', true, true,
    ['Atlas Necklace', 'A fine chain with a small peak pendant.', 'A fine chain with a small triangular pendant, a nod to the Atlas mountains. Sits just below the collarbone.', 'Gold vermeil'],
    ['Collier Atlas', 'Une chaîne fine avec un petit pendentif en pointe.', 'Une chaîne fine avec un petit pendentif triangulaire, clin d’œil aux montagnes de l’Atlas. Se pose juste sous la clavicule.', 'Vermeil']],
  ['zahra-pendant', 'necklaces', 'MJ-N-002', 640, '4 g', 'Chain 42 cm', true, false,
    ['Zahra Pendant', 'A small flower on a thin chain.', 'A small hand-finished flower on a thin chain. Zahra means flower.', 'Sterling silver'],
    ['Pendentif Zahra', 'Une petite fleur sur une chaîne fine.', 'Une petite fleur finie à la main, sur une chaîne fine. Zahra veut dire fleur.', 'Argent 925']],
  ['sahara-hoops', 'earrings', 'MJ-E-001', 390, '3 g', 'Diameter 25 mm', true, true,
    ['Sahara Hoops', 'Medium hoops with a hammered finish.', 'Medium-sized hoops with a softly hammered surface that catches the light. Light on the ear.', 'Gold vermeil'],
    ['Créoles Sahara', 'Créoles moyennes à la finition martelée.', 'Créoles de taille moyenne, à la surface légèrement martelée qui accroche la lumière. Légères à l’oreille.', 'Vermeil']],
  ['nour-studs', 'earrings', 'MJ-E-002', 290, '1 g', 'Diameter 6 mm', false, false,
    ['Nour Studs', 'Tiny round studs.', 'Tiny round studs for every day. Nour means light.', 'Sterling silver'],
    ['Clous Nour', 'De minuscules clous ronds.', 'De minuscules clous ronds, pour tous les jours. Nour veut dire lumière.', 'Argent 925']],
  ['marrakech-cuff', 'bracelets', 'MJ-B-001', 560, '8 g', 'Open, adjustable', true, false,
    ['Marrakech Cuff', 'An open cuff with a fine engraved pattern.', 'An open cuff engraved with a fine geometric pattern. The opening can be adjusted gently to fit your wrist.', 'Sterling silver'],
    ['Manchette Marrakech', 'Une manchette ouverte, gravée d’un motif fin.', 'Une manchette ouverte gravée d’un fin motif géométrique. L’ouverture s’ajuste doucement à votre poignet.', 'Argent 925']],
  ['safran-bracelet', 'bracelets', 'MJ-B-002', 480, '4 g', 'Length 17 to 20 cm', false, true,
    ['Safran Bracelet', 'A chain bracelet with an adjustable clasp.', 'A fine chain bracelet that fits wrists from 17 to 20 cm thanks to its adjustable clasp.', 'Gold vermeil'],
    ['Bracelet Safran', 'Un bracelet chaîne au fermoir réglable.', 'Un bracelet chaîne fin qui s’adapte aux poignets de 17 à 20 cm grâce à son fermoir réglable.', 'Vermeil']],
];

const sections = [
  { en: ['Care', 'Keep it away from water, perfume and lotions. Wipe it with a soft dry cloth after wearing and store it in its pouch.'], fr: ['Entretien', 'Évitez l’eau, le parfum et les crèmes. Essuyez-le avec un chiffon doux et sec après l’avoir porté, et rangez-le dans sa pochette.'] },
  { en: ['Delivery', 'We deliver across Morocco and you pay when the parcel arrives.'], fr: ['Livraison', 'Nous livrons partout au Maroc et vous payez à la réception du colis.'] },
];

const faqs: [string[], string[]][] = [
  [['How do I order?', 'Add what you like to the cart and fill in your delivery details. We will call or message you to confirm before anything is sent.'], ['Comment commander ?', 'Ajoutez vos bijoux au panier et remplissez vos informations de livraison. Nous vous appelons ou vous écrivons pour confirmer avant tout envoi.']],
  [['How do I pay?', 'You pay in cash when the parcel is delivered.'], ['Comment payer ?', 'Vous payez en espèces à la réception du colis.']],
  [['How should I look after my jewelry?', 'Keep it away from water, perfume and lotions, wipe it with a soft cloth, and store it in its pouch.'], ['Comment entretenir mes bijoux ?', 'Évitez l’eau, le parfum et les crèmes, essuyez-les avec un chiffon doux et rangez-les dans leur pochette.']],
  [['Can I ask about a piece before ordering?', 'Yes. Message us on WhatsApp or through the contact page and we will get back to you.'], ['Puis-je poser une question avant de commander ?', 'Oui. Écrivez-nous sur WhatsApp ou depuis la page contact, nous vous répondrons.']],
];

const announcements: [string, string][] = [
  ['Pay when your order arrives. Cash on delivery across Morocco.', 'Payez à la réception de votre commande. Paiement à la livraison partout au Maroc.'],
  ['Questions about a piece? Send us a message on WhatsApp.', 'Une question sur un bijou ? Écrivez-nous sur WhatsApp.'],
  ['New pieces have just arrived. Take a look.', 'De nouvelles pièces viennent d’arriver. Venez voir.'],
];

export const TABLES = [
  'app_users', 'admin_password_recovery', 'admin_trusted_devices', 'admin_login_attempts', 'privileges', 'roles', 'role_privileges', 'user_roles', 'languages',
  'categories', 'category_translations', 'products', 'product_translations', 'product_images', 'product_image_translations',
  'product_sections', 'product_section_translations', 'slides', 'slide_translations', 'faqs', 'faq_translations',
  'announcements', 'announcement_translations', 'site_settings', 'private_settings', 'orders', 'messages', 'audit_log',
];

export function seedDb(): DB {
  const db: DB = Object.fromEntries(TABLES.map((t) => [t, []]));

  db.languages.push(
    { code: 'fr', name: 'French', native_name: 'Français', direction: 'ltr', is_default: true, sort_order: 0, ...track() },
    { code: 'en', name: 'English', native_name: 'English', direction: 'ltr', is_default: false, sort_order: 1, ...track() },
  );

  for (const p of ALL_PRIVILEGES) {
    const mod = MODULES.find((m) => m.key === p.module)!;
    const [name, description] = verbs[p.action](mod.noun);
    db.privileges.push({ id: randomUUID(), module: p.module, action: p.action, code: p.code, name, description, ...track() });
  }
  for (const [code, name, description] of roles) {
    const id = ROLE_IDS[code];
    db.roles.push({ id, code, name, description, ...track() });
    for (const p of db.privileges) if (ROLE_RULES[code](p as any)) db.role_privileges.push({ id: randomUUID(), role_id: id, privilege_id: p.id, ...track() });
  }

  const catId: Record<string, string> = {};
  categories.forEach(([slug, en, fr, dEn, dFr], i) => {
    const id = (catId[slug] = randomUUID());
    db.categories.push({ id, slug, image_url: null, image_path: null, sort_order: i, ...track() });
    for (const [locale, name, description] of [['en', en, dEn], ['fr', fr, dFr]]) {
      db.category_translations.push({ id: randomUUID(), category_id: id, locale, name, description, seo_title: name, seo_description: description, ...track() });
    }
  });

  products.forEach(([slug, cat, sku, price, weight, dimensions, is_featured, is_new, en, fr], i) => {
    const id = randomUUID();
    db.products.push({ id, category_id: catId[cat], slug, sku, price, compare_price: null, show_price: true, stock: 0, track_stock: false, is_featured, is_new, weight, dimensions, sort_order: i, ...track() });
    for (const [locale, [name, short_description, description, material]] of [['en', en], ['fr', fr]] as const) {
      db.product_translations.push({ id: randomUUID(), product_id: id, locale, name, short_description, description, material, seo_title: name, seo_description: short_description, ...track() });
    }
    sections.forEach((s, n) => {
      const sid = randomUUID();
      db.product_sections.push({ id: sid, product_id: id, sort_order: n, ...track() });
      for (const locale of ['en', 'fr'] as const) db.product_section_translations.push({ id: randomUUID(), section_id: sid, locale, title: s[locale][0], body: s[locale][1], ...track() });
    });
  });

  faqs.forEach(([en, fr], i) => {
    const id = randomUUID();
    db.faqs.push({ id, sort_order: i, ...track() });
    db.faq_translations.push({ id: randomUUID(), faq_id: id, locale: 'en', question: en[0], answer: en[1], ...track() });
    db.faq_translations.push({ id: randomUUID(), faq_id: id, locale: 'fr', question: fr[0], answer: fr[1], ...track() });
  });

  announcements.forEach(([en, fr], i) => {
    const id = randomUUID();
    db.announcements.push({ id, sort_order: i, ...track() });
    db.announcement_translations.push({ id: randomUUID(), announcement_id: id, locale: 'en', message: en, ...track() });
    db.announcement_translations.push({ id: randomUUID(), announcement_id: id, locale: 'fr', message: fr, ...track() });
  });

  db.site_settings.push({ id: 1, data: structuredClone(defaultSettings), ...track() });
  db.private_settings.push({ id: 1, email: structuredClone(defaultEmailSettings), ...track() });
  return db;
}
