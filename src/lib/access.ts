/**
 * What an admin can be allowed to do. Shared by the portal (to hide buttons), the server actions
 * (to refuse the request) and the test-mode seed. Mirrors supabase/sql/01_basic_setup_seed.sql.
 */
export type Action = 'view' | 'add' | 'update' | 'toggle' | 'delete';

const CRUD: Action[] = ['view', 'add', 'update', 'toggle', 'delete'];

export const MODULES = [
  { key: 'dashboard', label: 'Dashboard', noun: 'dashboard', actions: ['view'] as Action[] },
  { key: 'products', label: 'Products', noun: 'products', actions: CRUD },
  { key: 'categories', label: 'Categories', noun: 'categories', actions: CRUD },
  { key: 'slides', label: 'Hero slides', noun: 'hero slides', actions: CRUD },
  { key: 'faqs', label: 'FAQs', noun: 'FAQs', actions: CRUD },
  { key: 'announcements', label: 'Announcements', noun: 'announcements', actions: CRUD },
  { key: 'orders', label: 'Orders', noun: 'orders', actions: ['view', 'update', 'delete'] as Action[] },
  { key: 'messages', label: 'Messages', noun: 'messages', actions: ['view', 'update', 'delete'] as Action[] },
  { key: 'settings', label: 'Settings', noun: 'settings', actions: ['view', 'update'] as Action[] },
  { key: 'audit', label: 'Audit history', noun: 'the audit history', actions: ['view'] as Action[] },
] as const;

export type ModuleKey = (typeof MODULES)[number]['key'];
export const priv = (m: ModuleKey, a: Action) => `${m}.${a}`;

export const ALL_PRIVILEGES = MODULES.flatMap((m) => m.actions.map((a) => ({ module: m.key, action: a, code: `${m.key}.${a}` })));

/** Which privileges each seeded role gets. Mirrors supabase/sql/01_basic_setup_seed.sql. */
export const ROLE_RULES: Record<string, (p: { module: string; action: string; code: string }) => boolean> = {
  super_admin: () => true,
  store_manager: (p) => ['dashboard', 'products', 'categories', 'slides', 'faqs', 'announcements', 'orders', 'messages'].includes(p.module) || p.code === 'settings.view',
  content_editor: (p) => p.code === 'dashboard.view' || (['products', 'categories', 'slides', 'faqs', 'announcements'].includes(p.module) && p.action !== 'delete'),
  order_handler: (p) => ['dashboard.view', 'products.view', 'orders.view', 'orders.update', 'messages.view', 'messages.update'].includes(p.code),
  viewer: (p) => p.action === 'view' && !['settings', 'audit'].includes(p.module),
};

export type AccessSet = { has: (code: string) => boolean };
export const makeAccess = (list: string[]): AccessSet => { const s = new Set(list); return { has: (c) => s.has(c) }; };
