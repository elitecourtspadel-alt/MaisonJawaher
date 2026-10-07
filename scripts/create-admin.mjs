// Creates an admin user (or resets that person's password and role).
//   node scripts/create-admin.mjs                      asks for everything
//   node scripts/create-admin.mjs --email a@b.com --password "..." --name "Full Name" --role super_admin
// Works in both modes: test (local files) and supabase.
// DEVELOPMENT TOOL: creates an admin in the selected dev environment (asks for email, name, role and password).
// 2FA stays off (the admin can enable it under Security & 2FA). It refuses to run against production; use
// create-admin-production.bat there (temporary password, forced reset, mandatory 2FA).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { stdin, stdout } from 'node:process';
import { normalizeAdminPath } from '../src/lib/admin-path.mjs';
import path from 'node:path';
import { loadEnvironment } from './environment.mjs';
import { createClient } from '@supabase/supabase-js';

let environment;
try { environment = loadEnvironment(); } catch (e) { console.error(e.message); process.exit(1); }

const mode = (process.env.APP_MODE || '').toLowerCase();
const testMode = mode === 'test' || mode === 'local' || (mode !== 'supabase' && !process.env.NEXT_PUBLIC_SUPABASE_URL);

// Same ids as supabase/sql/01_basic_setup_seed.sql
const ROLES = [
  { code: 'super_admin', id: '00000000-0000-4000-8000-000000000001', name: 'Super Administrator', about: 'Can do everything, including the audit history and settings' },
  { code: 'store_manager', id: '00000000-0000-4000-8000-000000000002', name: 'Store Manager', about: 'Catalogue, orders, messages, announcements' },
  { code: 'content_editor', id: '00000000-0000-4000-8000-000000000003', name: 'Content Editor', about: 'Writes and updates content, cannot delete' },
  { code: 'order_handler', id: '00000000-0000-4000-8000-000000000004', name: 'Order Handler', about: 'Orders and customer messages' },
  { code: 'viewer', id: '00000000-0000-4000-8000-000000000005', name: 'Viewer', about: 'Read only' },
];

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : undefined; };
const fail = (m) => { console.error(`\n  ✘ ${m}\n`); process.exit(1); };

console.log(`
  Maison Jawaher - create an admin
  --------------------------------
  Mode: ${testMode ? 'TEST (local files, no Supabase)' : 'SUPABASE'}
  Environment: ${environment.name} - for testing only: 2FA is off unless the admin turns it on.
  Use a password you will remember (at least 10 characters).
  Running this again for the same email resets that person's password and role.
`);

if (/^prod(uction)?([-_]|$)/.test(environment.name)) fail('This quick tool is for development only. For production use create-admin-production.bat.');
let email = arg('email'), password = arg('password'), name = arg('name'), roleCode = arg('role');
if (!email || !password) {
  const rl = createInterface({ input: stdin, output: stdout });
  email ||= (await rl.question('  Email: ')).trim();
  name ||= (await rl.question('  Full name: ')).trim();
  password ||= (await rl.question('  Password (at least 10 characters): ')).trim();
  if (!roleCode) {
    console.log('\n  Role:');
    ROLES.forEach((r, i) => console.log(`    ${i + 1}. ${r.name}  -  ${r.about}`));
    const pick = (await rl.question('\n  Choose 1-5 (press Enter for 1): ')).trim();
    roleCode = ROLES[(Number(pick) || 1) - 1]?.code;
  }
  rl.close();
}
roleCode ||= 'super_admin';
const role = ROLES.find((r) => r.code === roleCode);
if (!role) fail(`Unknown role "${roleCode}". Use one of: ${ROLES.map((r) => r.code).join(', ')}`);
if (!/^\S+@\S+\.\S+$/.test(email || '')) fail('That email address does not look right.');
if ((password || '').length < 10) fail('The password must be at least 10 characters.');
email = email.toLowerCase();
name = (name || email.split('@')[0]).trim();
const now = new Date().toISOString();
const tracking = (by = null) => ({ is_active: true, created_by: by, created_at: now, updated_by: by, updated_at: now });

/* ───────── test mode ───────── */
if (testMode) {
  const dir = path.resolve(process.env.LOCAL_DATA_DIR || '.data');
  const file = path.join(dir, 'db.json');
  mkdirSync(dir, { recursive: true });
  const db = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { __needsSeed: true };
  db.app_users ??= []; db.user_roles ??= [];
  const salt = randomBytes(16);
  const hash = `scrypt$${salt.toString('base64')}$${scryptSync(password, salt, 64).toString('base64')}`;
  let user = db.app_users.find((u) => u.email === email);
  if (user) { Object.assign(user, { password_hash: hash, full_name: name, is_active: true, updated_at: now }); console.log('  That email already existed: password updated.'); }
  else { user = { id: randomUUID(), email, full_name: name, password_hash: hash, totp_secret: null, totp_pending: null, totp_enabled: false, ...tracking() }; db.app_users.push(user); }
  db.user_roles = db.user_roles.filter((r) => r.user_id !== user.id);
  db.user_roles.push({ id: randomUUID(), user_id: user.id, role_id: role.id, ...tracking() });
  writeFileSync(file, JSON.stringify(db));
  console.log(`  ✔ Admin ready: ${email} (${role.name})\n\n  Start the site, then sign in at ${normalizeAdminPath(process.env.NEXT_PUBLIC_ADMIN_PATH)}. You can turn on 2FA under Security & 2FA.\n`);
  process.exit(0);
}

/* ───────── supabase mode ───────── */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing in .env.local.');
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: roleRow, error: roleErr } = await sb.from('roles').select('id').eq('code', role.code).maybeSingle();
if (roleErr || !roleRow) fail('The roles table is empty or missing. Run setup-fresh.bat first (it creates the tables and loads the roles).');

let userId;
const created = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) {
  if (!/already|registered|exists/i.test(created.error.message)) fail(created.error.message);
  let found;
  for (let page = 1; page < 50 && !found; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data.users.length) break;
    found = data.users.find((u) => u.email?.toLowerCase() === email);
  }
  if (!found) fail('That user already exists in Supabase Auth but could not be found.');
  userId = found.id;
  const upd = await sb.auth.admin.updateUserById(userId, { password, email_confirm: true });
  if (upd.error) fail(upd.error.message);
  console.log('  That email already existed: password updated.');
} else userId = created.data.user.id;

const u = await sb.from('app_users').upsert({ id: userId, email, full_name: name, is_active: true, updated_at: now });
if (u.error) fail(`Could not save the user: ${u.error.message}`);
await sb.from('user_roles').delete().eq('user_id', userId);
const r = await sb.from('user_roles').insert({ user_id: userId, role_id: roleRow.id });
if (r.error) fail(`Could not assign the role: ${r.error.message}`);
console.log(`  ✔ Admin ready: ${email} (${role.name})\n\n  Sign in at ${normalizeAdminPath(process.env.NEXT_PUBLIC_ADMIN_PATH)}. You can turn on 2FA under Security & 2FA.\n`);
