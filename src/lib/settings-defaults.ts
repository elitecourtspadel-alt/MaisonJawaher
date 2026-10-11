import type { EmailSettings, SiteSettings } from './types';

export const defaultSettings: SiteSettings = {
  hero_background_url: '',
  hero_background_path: '',
  admin_idle_timeout_minutes: 30,
  admin_trusted_devices_enabled: true,
  admin_trusted_device_days: 30,
  admin_max_trusted_devices: 2,
  admin_max_failed_logins: 5,
  admin_lockout_minutes: 15,
  show_prices: false,
  currency: 'MAD',
  enable_orders: true,
  phone: '+212 600 000 000',
  whatsapp_number: '212600000000',
  whatsapp_community_url: '',
  show_community_button: true,
  show_location: true,
  email: 'hello@maisonjawaher.com',
  address: { en: 'Marrakech, Morocco', fr: 'Marrakech, Maroc' },
  map_url: '',
  hours: [
    { open: '10:00', close: '19:00', closed: false },
    { open: '10:00', close: '19:00', closed: false },
    { open: '10:00', close: '19:00', closed: false },
    { open: '10:00', close: '19:00', closed: false },
    { open: '10:00', close: '19:00', closed: false },
    { open: '10:00', close: '20:00', closed: false },
    { open: '', close: '', closed: true },
  ],
  socials: [
    { platform: 'instagram', url: '', enabled: false },
    { platform: 'facebook', url: '', enabled: false },
    { platform: 'tiktok', url: '', enabled: false },
    { platform: 'pinterest', url: '', enabled: false },
    { platform: 'youtube', url: '', enabled: false },
    { platform: 'x', url: '', enabled: false },
    { platform: 'snapchat', url: '', enabled: false },
    { platform: 'threads', url: '', enabled: false },
  ],
  community_title: { en: '', fr: '' },
  community_message: { en: '', fr: '' },
  site_title: { en: 'Maison Jawaher | Jewelry made in Morocco', fr: 'Maison Jawaher | Bijoux faits au Maroc' },
  site_description: {
    en: 'Rings, necklaces, earrings and bracelets designed in Morocco and finished by hand. Cash on delivery across the country.',
    fr: 'Bagues, colliers, boucles d’oreilles et bracelets dessinés au Maroc et finis à la main. Paiement à la livraison partout au Maroc.',
  },
};

export const defaultEmailSettings: EmailSettings = {
  enabled: true, notify_admin: true, notify_customer: true, admin_email: '', admin_locale: 'en',
};

export const platforms = ['instagram', 'facebook', 'tiktok', 'whatsapp', 'pinterest', 'youtube', 'x', 'snapchat', 'threads'] as const;

export function mergeSettings(data: Partial<SiteSettings> | null | undefined): SiteSettings {
  const d = data ?? {};
  // only known keys: anything else left in an older row (for example the old private email field) never reaches the browser
  const known = Object.fromEntries(Object.entries(d).filter(([k]) => k in defaultSettings));
  const merged = { ...defaultSettings, ...known } as SiteSettings;
  if (typeof merged.admin_trusted_devices_enabled !== 'boolean') merged.admin_trusted_devices_enabled = true;
  if (!Number.isInteger(merged.admin_trusted_device_days) || merged.admin_trusted_device_days < 1 || merged.admin_trusted_device_days > 90) merged.admin_trusted_device_days = 30;
  if (!Number.isInteger(merged.admin_max_trusted_devices) || merged.admin_max_trusted_devices < 1 || merged.admin_max_trusted_devices > 10) merged.admin_max_trusted_devices = 2;
  if (!Number.isInteger(merged.admin_max_failed_logins) || merged.admin_max_failed_logins < 1 || merged.admin_max_failed_logins > 20) merged.admin_max_failed_logins = 5;
  if (!Number.isInteger(merged.admin_lockout_minutes) || merged.admin_lockout_minutes < 1 || merged.admin_lockout_minutes > 1440) merged.admin_lockout_minutes = 15;
  if (!Number.isInteger(merged.admin_idle_timeout_minutes) || merged.admin_idle_timeout_minutes < 5 || merged.admin_idle_timeout_minutes > 240) merged.admin_idle_timeout_minutes = 30;
  merged.hours = defaultSettings.hours.map((h, i) => ({ ...h, ...(d.hours?.[i] ?? {}) }));
  merged.socials = defaultSettings.socials.map((s) => ({ ...s, ...(d.socials?.find((x) => x.platform === s.platform) ?? {}) }));
  merged.address = { ...defaultSettings.address, ...(d.address ?? {}) };
  merged.site_title = { ...defaultSettings.site_title, ...(d.site_title ?? {}) };
  merged.community_title = { ...defaultSettings.community_title, ...(d.community_title ?? {}) };
  merged.community_message = { ...defaultSettings.community_message, ...(d.community_message ?? {}) };
  merged.site_description = { ...defaultSettings.site_description, ...(d.site_description ?? {}) };
  return merged;
}
