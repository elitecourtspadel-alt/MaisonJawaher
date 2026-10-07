/** Columns every table has. */
export type Tracking = { is_active: boolean; created_by: string | null; created_at: string; updated_by: string | null; updated_at: string };

/** One language's wording for a row. Field names depend on the table (name, description, title...). */
export type Tr = { id?: string; locale: string } & Record<string, string | undefined>;
export type Translated = { translations: Tr[] };

export type Language = { code: string; name: string; native_name: string; direction: 'ltr' | 'rtl'; is_default: boolean; sort_order: number; is_active: boolean };

export type Category = Tracking & Translated & {
  id: string; slug: string; image_url: string | null; image_path: string | null; sort_order: number;
  product_count?: number;
};

export type ProductImage = Tracking & Translated & { id: string; product_id: string; url: string; path: string | null; sort_order: number };
export type ProductSection = Tracking & Translated & { id: string; product_id: string; sort_order: number };

export type Product = Tracking & Translated & {
  id: string; category_id: string | null; slug: string; sku: string;
  price: number | null; compare_price: number | null; show_price: boolean; stock: number; track_stock: boolean;
  is_featured: boolean; is_new: boolean; weight: string; dimensions: string; sort_order: number;
  product_images?: ProductImage[]; product_sections?: ProductSection[];
  categories?: ({ id: string; slug: string; is_active: boolean } & Translated) | null;
};

export type Slide = Tracking & Translated & { id: string; image_url: string; image_path: string | null; cta_url: string; sort_order: number };
export type Faq = Tracking & Translated & { id: string; sort_order: number };
export type Announcement = Tracking & Translated & { id: string; sort_order: number };

export type SocialLink = { platform: string; url: string; enabled: boolean };
export type HoursRow = { open: string; close: string; closed: boolean };
/** A text that exists once per language: { en: "...", fr: "..." } */
export type TextMap = Record<string, string>;

export type SiteSettings = {
  hero_background_url: string;
  hero_background_path: string;
  admin_idle_timeout_minutes: number;
  /** Wrong passwords allowed before an admin account is blocked, and for how long. */
  admin_max_failed_logins: number;
  admin_lockout_minutes: number;
  admin_trusted_devices_enabled: boolean;
  admin_trusted_device_days: number;
  admin_max_trusted_devices: number;
  show_prices: boolean;
  currency: string;
  enable_orders: boolean;
  phone: string;
  whatsapp_number: string;
  whatsapp_community_url: string;
  show_community_button: boolean;
  show_location: boolean;
  email: string;
  address: TextMap;
  map_url: string;
  hours: HoursRow[]; // Monday..Sunday
  socials: SocialLink[];
  site_title: TextMap;
  site_description: TextMap;
  /** Heading and message of the community invitation card, per language. Empty = the built-in wording. */
  community_title: TextMap;
  community_message: TextMap;
};

/**
 * Email behaviour, switched on and off from the portal. Kept in private_settings (never sent to the browser).
 * The mail server itself (SMTP host, user, password, sender) is configured in the environment, not here.
 */
export type EmailSettings = {
  enabled: boolean;          // master switch: when off, the site sends no email at all
  notify_admin: boolean;     // new order / new message alerts to the admin address
  notify_customer: boolean;  // order confirmation to the customer (only when they gave an email)
  admin_email: string;       // where the admin alerts go; empty = the public contact email
  admin_locale: string;      // language of the admin alerts
};

export type OrderItem = { id: string; slug: string; name: string; price: number | null; qty: number; image?: string | null };
export type Order = Tracking & {
  id: string; number: number; name: string; phone: string; email: string; city: string; address: string; notes: string;
  items: OrderItem[]; total: number | null; status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'; locale: string;
};
export type Message = Tracking & { id: string; name: string; email: string; phone: string; subject: string; body: string; locale: string; is_read: boolean };

export type AuditChange = { label: string; from?: string; to?: string };
export type AuditEntry = Tracking & {
  id: string; actor_id: string | null; actor_name: string; action: string; entity: string; entity_id: string | null;
  entity_label: string; summary: string; details: AuditChange[];
};
