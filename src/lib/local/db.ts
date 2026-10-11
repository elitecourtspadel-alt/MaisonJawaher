import 'server-only';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { seedDb, TABLES, type DB } from './seed';

/**
 * Test-mode backend: a JSON-file database plus local file storage that mimics the part of the supabase-js
 * client this app uses (from().select/insert/update/upsert/delete, nested selects, storage).
 * It enforces the same rules as the SQL scripts: unique keys, cascading deletes, RESTRICT on categories
 * that still have products, and the "public can only see active rows" policies.
 */
type Row = Record<string, any>;
type Role = 'anon' | 'service';

export const dataDir = () => path.resolve(/*turbopackIgnore: true*/ process.env.LOCAL_DATA_DIR || '.data');
const dbFile = () => path.join(dataDir(), 'db.json');
export const uploadsDir = () => path.join(dataDir(), 'uploads');

const now = () => new Date().toISOString();
const PK: Record<string, string> = { languages: 'code', site_settings: 'id', private_settings: 'id' };
const NO_UUID = new Set(['languages', 'site_settings', 'private_settings']);

const UNIQUE: Record<string, string[][]> = {
  app_users: [['email']], privileges: [['code']], roles: [['code']], role_privileges: [['role_id', 'privilege_id']], user_roles: [['user_id', 'role_id']],
  categories: [['slug']], products: [['slug']],
  category_translations: [['category_id', 'locale']], product_translations: [['product_id', 'locale']],
  product_image_translations: [['image_id', 'locale']], product_section_translations: [['section_id', 'locale']],
  slide_translations: [['slide_id', 'locale']], faq_translations: [['faq_id', 'locale']], announcement_translations: [['announcement_id', 'locale']],
};

const DEFAULTS: Record<string, () => Row> = {
  app_users: () => ({ full_name: '', mfa_required: false, password_change_required: false }),
  privileges: () => ({ description: '' }),
  roles: () => ({ description: '' }),
  languages: () => ({ direction: 'ltr', is_default: false, sort_order: 0 }),
  categories: () => ({ image_url: null, image_path: null, sort_order: 0 }),
  category_translations: () => ({ name: '', description: '', seo_title: '', seo_description: '' }),
  products: () => ({ category_id: null, sku: '', price: null, compare_price: null, show_price: true, stock: 0, track_stock: false, is_featured: false, is_new: false, weight: '', dimensions: '', sort_order: 0 }),
  product_translations: () => ({ name: '', short_description: '', description: '', material: '', seo_title: '', seo_description: '' }),
  product_images: () => ({ path: null, sort_order: 0 }),
  product_image_translations: () => ({ alt_text: '' }),
  product_sections: () => ({ sort_order: 0 }),
  product_section_translations: () => ({ title: '', body: '' }),
  slides: () => ({ image_path: null, cta_url: '', sort_order: 0 }),
  slide_translations: () => ({ title: '', subtitle: '', cta_label: '' }),
  faqs: () => ({ sort_order: 0 }),
  faq_translations: () => ({ question: '', answer: '' }),
  announcements: () => ({ sort_order: 0 }),
  announcement_translations: () => ({ message: '' }),
  site_settings: () => ({ data: {} }),
  private_settings: () => ({ email: {} }),
  orders: () => ({ email: '', notes: '', items: [], total: null, status: 'new', locale: 'en' }),
  messages: () => ({ phone: '', subject: '', locale: 'en', is_read: false }),
  audit_log: () => ({ actor_id: null, actor_name: '', entity_id: null, entity_label: '', details: [] }),
};

/** Nested-select relations: name used in select('...') -> how to find the rows. */
const REL: Record<string, Record<string, { kind: 'many' | 'one'; table: string; fk: string }>> = {
  products: {
    product_translations: { kind: 'many', table: 'product_translations', fk: 'product_id' },
    product_images: { kind: 'many', table: 'product_images', fk: 'product_id' },
    product_sections: { kind: 'many', table: 'product_sections', fk: 'product_id' },
    categories: { kind: 'one', table: 'categories', fk: 'category_id' },
  },
  product_images: { product_image_translations: { kind: 'many', table: 'product_image_translations', fk: 'image_id' } },
  product_sections: { product_section_translations: { kind: 'many', table: 'product_section_translations', fk: 'section_id' } },
  categories: { category_translations: { kind: 'many', table: 'category_translations', fk: 'category_id' } },
  slides: { slide_translations: { kind: 'many', table: 'slide_translations', fk: 'slide_id' } },
  faqs: { faq_translations: { kind: 'many', table: 'faq_translations', fk: 'faq_id' } },
  announcements: { announcement_translations: { kind: 'many', table: 'announcement_translations', fk: 'announcement_id' } },
  user_roles: { roles: { kind: 'one', table: 'roles', fk: 'role_id' } },
  roles: { role_privileges: { kind: 'many', table: 'role_privileges', fk: 'role_id' } },
  role_privileges: { privileges: { kind: 'one', table: 'privileges', fk: 'privilege_id' } },
  app_users: { user_roles: { kind: 'many', table: 'user_roles', fk: 'user_id' } },
};

/** What happens to child rows when a parent row is deleted. */
const CHILDREN: Record<string, { table: string; fk: string; mode: 'cascade' | 'restrict' }[]> = {
  products: [{ table: 'product_translations', fk: 'product_id', mode: 'cascade' }, { table: 'product_images', fk: 'product_id', mode: 'cascade' }, { table: 'product_sections', fk: 'product_id', mode: 'cascade' }],
  product_images: [{ table: 'product_image_translations', fk: 'image_id', mode: 'cascade' }],
  product_sections: [{ table: 'product_section_translations', fk: 'section_id', mode: 'cascade' }],
  categories: [{ table: 'category_translations', fk: 'category_id', mode: 'cascade' }, { table: 'products', fk: 'category_id', mode: 'restrict' }],
  slides: [{ table: 'slide_translations', fk: 'slide_id', mode: 'cascade' }],
  faqs: [{ table: 'faq_translations', fk: 'faq_id', mode: 'cascade' }],
  announcements: [{ table: 'announcement_translations', fk: 'announcement_id', mode: 'cascade' }],
  roles: [{ table: 'role_privileges', fk: 'role_id', mode: 'cascade' }, { table: 'user_roles', fk: 'role_id', mode: 'cascade' }],
  privileges: [{ table: 'role_privileges', fk: 'privilege_id', mode: 'cascade' }],
  app_users: [{ table: 'user_roles', fk: 'user_id', mode: 'cascade' }, { table: 'admin_password_recovery', fk: 'user_id', mode: 'cascade' }, { table: 'admin_trusted_devices', fk: 'user_id', mode: 'cascade' }, { table: 'admin_login_attempts', fk: 'user_id', mode: 'cascade' }],
};

/** Public (anon) read access: the same rules as supabase/sql/17_security_and_storage.sql. */
const catPublic = (db: DB, id: string | null) => id == null || db.categories.some((c) => c.id === id && c.is_active);
const prodPublic = (db: DB, id: string) => db.products.some((p) => p.id === id && p.is_active && catPublic(db, p.category_id));
const PUBLIC: Record<string, (r: Row, db: DB) => boolean> = {
  languages: (r) => r.is_active,
  site_settings: () => true,
  categories: (r) => r.is_active,
  category_translations: (r, db) => r.is_active && catPublic(db, r.category_id),
  products: (r, db) => r.is_active && catPublic(db, r.category_id),
  product_translations: (r, db) => r.is_active && prodPublic(db, r.product_id),
  product_images: (r, db) => r.is_active && prodPublic(db, r.product_id),
  product_image_translations: (r, db) => r.is_active && db.product_images.some((i) => i.id === r.image_id && i.is_active && prodPublic(db, i.product_id)),
  product_sections: (r, db) => r.is_active && prodPublic(db, r.product_id),
  product_section_translations: (r, db) => r.is_active && db.product_sections.some((s) => s.id === r.section_id && s.is_active && prodPublic(db, s.product_id)),
  slides: (r) => r.is_active,
  slide_translations: (r, db) => r.is_active && db.slides.some((s) => s.id === r.slide_id && s.is_active),
  faqs: (r) => r.is_active,
  faq_translations: (r, db) => r.is_active && db.faqs.some((f) => f.id === r.faq_id && f.is_active),
  announcements: (r) => r.is_active,
  announcement_translations: (r, db) => r.is_active && db.announcements.some((a) => a.id === r.announcement_id && a.is_active),
};

/* ───────── store ───────── */
const g = globalThis as unknown as { __mjdb?: { db: DB; mtime: number } };

export function getDb(): DB {
  let mtime = 0;
  try { mtime = fs.statSync(dbFile()).mtimeMs; } catch { /* first run */ }
  if (!g.__mjdb || g.__mjdb.mtime !== mtime) {
    let db: DB;
    if (mtime) {
      db = JSON.parse(fs.readFileSync(dbFile(), 'utf8'));
      if ((db as any).__needsSeed) {
        // create-admin ran before the first start: add the sample data around the admin it created
        const fresh = seedDb();
        for (const t of TABLES) if (!['app_users', 'user_roles', 'admin_password_recovery'].includes(t)) db[t] = fresh[t];
        delete (db as any).__needsSeed;
        fs.writeFileSync(dbFile(), JSON.stringify(db));
        mtime = fs.statSync(dbFile()).mtimeMs;
      }
    } else {
      db = seedDb();
      fs.mkdirSync(dataDir(), { recursive: true });
      fs.writeFileSync(dbFile(), JSON.stringify(db));
      mtime = fs.statSync(dbFile()).mtimeMs;
    }
    for (const t of TABLES) db[t] ??= [];
    g.__mjdb = { db, mtime };
  }
  return g.__mjdb.db;
}

export function saveDb() {
  fs.mkdirSync(dataDir(), { recursive: true });
  fs.writeFileSync(dbFile(), JSON.stringify(g.__mjdb!.db));
  g.__mjdb!.mtime = fs.statSync(dbFile()).mtimeMs;
}

/* ───────── query builder ───────── */
type Result = { data: any; error: { message: string; code?: string } | null; count?: number | null };
const err = (message: string, code?: string): Result => ({ data: null, error: { message, code } });

function splitTop(s: string) {
  const out: string[] = []; let depth = 0, cur = '';
  for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch; }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim());
}

class Query implements PromiseLike<Result> {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' | null = null;
  private cols = '*';
  private opts: { count?: string; head?: boolean } = {};
  private payload: any;
  private returning = false;
  private filters: ((r: Row) => boolean)[] = [];
  private sorts: { c: string; asc: boolean }[] = [];
  private lim?: number;
  private off = 0;
  private shape: 'many' | 'single' | 'maybe' = 'many';

  constructor(private table: string, private role: Role) {}

  select(cols = '*', opts: { count?: string; head?: boolean } = {}) {
    if (this.op) { this.returning = true; this.cols = cols; } else { this.op = 'select'; this.cols = cols; this.opts = opts; }
    return this;
  }
  insert(v: any) { this.op = 'insert'; this.payload = v; return this; }
  update(v: any) { this.op = 'update'; this.payload = v; return this; }
  upsert(v: any) { this.op = 'upsert'; this.payload = v; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v); return this; }
  neq(c: string, v: any) { this.filters.push((r) => r[c] !== v); return this; }
  in(c: string, vs: any[]) { this.filters.push((r) => vs.includes(r[c])); return this; }
  ilike(c: string, pattern: string) {
    const rx = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')}$`, 'i');
    this.filters.push((r) => rx.test(String(r[c] ?? '')));
    return this;
  }
  order(c: string, o: { ascending?: boolean } = {}) { this.sorts.push({ c, asc: o.ascending !== false }); return this; }
  limit(n: number) { this.lim = n; return this; }
  range(from: number, to: number) { this.off = from; this.lim = to - from + 1; return this; }
  single() { this.shape = 'single'; return this; }
  maybeSingle() { this.shape = 'maybe'; return this; }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, bad?: ((e: any) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.run()).then(ok, bad);
  }

  private visible(table: string, r: Row, db: DB) { return this.role === 'service' || (PUBLIC[table]?.(r, db) ?? false); }

  private project(table: string, row: Row, cols: string, db: DB): Row {
    const out: Row = {};
    for (const t of splitTop(cols)) {
      const rel = /^(\w+)\((.*)\)$/.exec(t);
      if (t === '*') Object.assign(out, row);
      else if (rel) {
        const [, name, inner] = rel;
        const spec = REL[table]?.[name];
        if (!spec) continue;
        if (spec.kind === 'many') out[name] = db[spec.table].filter((c) => c[spec.fk] === row.id && this.visible(spec.table, c, db)).map((c) => this.project(spec.table, c, inner, db));
        else { const p = db[spec.table].find((x) => x.id === row[spec.fk]); out[name] = p && this.visible(spec.table, p, db) ? this.project(spec.table, p, inner, db) : null; }
      } else out[t] = row[t];
    }
    return out;
  }

  private finish(rows: Row[], db: DB, count?: number): Result {
    const data = rows.map((r) => structuredClone(this.project(this.table, r, this.cols, db)));
    if (this.shape === 'many') return { data, error: null, count };
    if (this.shape === 'maybe') return { data: data[0] ?? null, error: null };
    return data.length === 1 ? { data: data[0], error: null } : err('JSON object requested, multiple (or no) rows returned', 'PGRST116');
  }

  private conflict(db: DB, row: Row, self?: Row): Result | null {
    for (const keys of UNIQUE[this.table] ?? []) {
      if (db[this.table].some((x) => x !== self && keys.every((k) => x[k] === row[k]))) return err(`duplicate key value violates unique constraint (${keys.join(', ')})`, '23505');
    }
    return null;
  }

  /** Deletes rows and everything that hangs off them. Returns an error result if a RESTRICT rule blocks it. */
  private remove(db: DB, table: string, rows: Row[]): Result | null {
    const pk = PK[table] ?? 'id';
    for (const rule of CHILDREN[table] ?? []) {
      const kids = db[rule.table].filter((c) => rows.some((r) => c[rule.fk] === r[pk]));
      if (!kids.length) continue;
      if (rule.mode === 'restrict') return err(`update or delete on table "${table}" violates foreign key constraint on table "${rule.table}"`, '23503');
    }
    for (const rule of CHILDREN[table] ?? []) {
      if (rule.mode !== 'cascade') continue;
      const kids = db[rule.table].filter((c) => rows.some((r) => c[rule.fk] === r[pk]));
      if (kids.length) { const e = this.remove(db, rule.table, kids); if (e) return e; }
    }
    db[table] = db[table].filter((r) => !rows.includes(r));
    return null;
  }

  private run(): Result {
    const db = getDb();
    const table = db[this.table];
    if (!table) return err(`relation "${this.table}" does not exist`);
    const match = (r: Row) => this.visible(this.table, r, db) && this.filters.every((f) => f(r));

    if (this.op === 'select' || !this.op) {
      let rows = table.filter(match);
      for (const s of [...this.sorts].reverse()) rows = [...rows].sort((a, b) => (a[s.c] === b[s.c] ? 0 : (a[s.c] ?? '') > (b[s.c] ?? '') ? 1 : -1) * (s.asc ? 1 : -1));
      const count = rows.length;
      if (this.lim != null) rows = rows.slice(this.off, this.off + this.lim);
      if (this.opts.head) return { data: null, error: null, count };
      return this.finish(rows, db, count);
    }
    if (this.role !== 'service') return err('permission denied');
    const pk = PK[this.table] ?? 'id';

    if (this.op === 'insert' || this.op === 'upsert') {
      const made: Row[] = [];
      for (const input of ([] as Row[]).concat(this.payload)) {
        const key = this.table === 'app_users' ? 'id' : pk;
        const existing = this.op === 'upsert' ? table.find((x) => x[key] === input[key]) : undefined;
        if (existing) {
          const e = this.conflict(db, { ...existing, ...input }, existing); if (e) return e;
          Object.assign(existing, input, { updated_at: now() }); made.push(existing); continue;
        }
        const row: Row = { is_active: true, created_by: null, created_at: now(), updated_by: null, updated_at: now(), ...DEFAULTS[this.table]?.(), ...input };
        if (!(pk in row) && !NO_UUID.has(this.table)) row.id = randomUUID();
        if (this.table === 'orders') row.number = Math.max(0, ...table.map((o) => o.number ?? 0)) + 1;
        const e = this.conflict(db, row); if (e) return e;
        table.push(row); made.push(row);
      }
      saveDb();
      return this.returning ? this.finish(made, db) : { data: null, error: null };
    }

    const targets = table.filter(match);
    if (this.op === 'update') {
      for (const r of targets) { const e = this.conflict(db, { ...r, ...this.payload }, r); if (e) return e; }
      for (const r of targets) Object.assign(r, this.payload, { updated_at: now() });
      saveDb();
      return this.returning ? this.finish(targets, db) : { data: null, error: null };
    }
    const e = this.remove(db, this.table, targets);
    if (e) return e;
    saveDb();
    return { data: null, error: null };
  }
}

/* ───────── storage ───────── */
const safeRel = (p: string) => path.posix.normalize(p).replace(/^(\.\.(\/|$))+/, '').replace(/^\/+/, '');
export const resolveUpload = (rel: string) => {
  const root = uploadsDir();
  const full = path.join(root, safeRel(rel));
  return full.startsWith(root + path.sep) ? full : null;
};

const storage = {
  from: (_bucket: string) => ({
    async list(prefix: string, options: { limit?: number; offset?: number } = {}) {
      const directory = resolveUpload(prefix);
      if (!directory || !fs.existsSync(directory)) return { data: [], error: null };
      const files = fs.readdirSync(directory).sort().slice(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 100)).map((name) => {
        const stat = fs.statSync(path.join(directory, name));
        return { name, id: stat.isFile() ? name : null, created_at: stat.birthtime.toISOString() };
      });
      return { data: files, error: null };
    },
    async upload(p: string, body: Buffer) {
      const full = resolveUpload(p);
      if (!full) return { data: null, error: { message: 'Invalid path' } };
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, body);
      return { data: { path: p }, error: null };
    },
    getPublicUrl: (p: string) => ({ data: { publicUrl: `/api/local-media/${p}` } }),
    async remove(paths: string[]) {
      for (const p of paths) {
        const f = resolveUpload(p);
        if (!f) return { data: null, error: { message: 'Invalid image path' } };
        try { fs.unlinkSync(f); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') return { data: null, error: { message: 'The image file could not be removed' } }; }
      }
      return { data: paths, error: null };
    },
  }),
};

export function createLocalClient(role: Role) {
  return { from: (t: string) => new Query(t, role), storage };
}
