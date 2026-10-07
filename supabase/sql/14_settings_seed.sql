-- Seed 09 · Starting values for the site settings. Every value here can be changed later from Admin > Settings.
-- The phone number, WhatsApp number and email below are placeholders: replace them before launch.
insert into public.site_settings (id, data) values (1, $json$
{
  "show_prices": false,
  "admin_idle_timeout_minutes": 30,
  "admin_trusted_devices_enabled": true,
  "admin_trusted_device_days": 30,
  "admin_max_trusted_devices": 2,
  "admin_max_failed_logins": 5,
  "admin_lockout_minutes": 15,
  "currency": "MAD",
  "enable_orders": true,
  "phone": "+212 600 000 000",
  "whatsapp_number": "212600000000",
  "whatsapp_community_url": "",
  "show_community_button": true,
  "show_location": true,
  "email": "hello@maisonjawaher.com",
  "address": { "en": "Marrakech, Morocco", "fr": "Marrakech, Maroc" },
  "map_url": "",
  "hours": [
    { "open": "10:00", "close": "19:00", "closed": false },
    { "open": "10:00", "close": "19:00", "closed": false },
    { "open": "10:00", "close": "19:00", "closed": false },
    { "open": "10:00", "close": "19:00", "closed": false },
    { "open": "10:00", "close": "19:00", "closed": false },
    { "open": "10:00", "close": "20:00", "closed": false },
    { "open": "", "close": "", "closed": true }
  ],
  "socials": [
    { "platform": "instagram", "url": "", "enabled": false },
    { "platform": "facebook",  "url": "", "enabled": false },
    { "platform": "tiktok",    "url": "", "enabled": false },
    { "platform": "pinterest", "url": "", "enabled": false },
    { "platform": "youtube",   "url": "", "enabled": false },
    { "platform": "x",         "url": "", "enabled": false },
    { "platform": "snapchat",  "url": "", "enabled": false },
    { "platform": "threads",   "url": "", "enabled": false }
  ],
  "site_title": {
    "en": "Maison Jawaher | Jewelry made in Morocco",
    "fr": "Maison Jawaher | Bijoux faits au Maroc"
  },
  "site_description": {
    "en": "Rings, necklaces, earrings and bracelets designed in Morocco and finished by hand. Cash on delivery across the country.",
    "fr": "Bagues, colliers, boucles d’oreilles et bracelets dessinés au Maroc et finis à la main. Paiement à la livraison partout au Maroc."
  }
}
$json$::jsonb)
on conflict (id) do nothing;

-- Email switches (private). Sending also needs the SMTP_* values in the environment; until then nothing is sent.
insert into public.private_settings (id, email) values (1, $json$
{
  "enabled": true,
  "notify_admin": true,
  "notify_customer": true,
  "admin_email": "",
  "admin_locale": "en"
}
$json$::jsonb)
on conflict (id) do nothing;
