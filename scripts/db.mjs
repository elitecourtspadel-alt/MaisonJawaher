// Database tasks for both run modes.
//   node scripts/db.mjs setup [--yes]   Fresh start: drop everything, rebuild the tables, load the seed data.
//   node scripts/db.mjs clear [--yes]   Remove the shop's own data (products, categories, orders, images...), keep users and setup.
//
// supabase mode: runs supabase/sql/NN_*.sql in numbered order. Schema and seed files share the folder;
//                files ending in _seed.sql hold sample data (setup loads them, migrate skips them). Needs SUPABASE_DB_URL.
// test mode:     the data lives in .data/ - setup deletes it (it is re-created with the seed data on next start).
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import path from 'node:path';
import { loadEnvironment } from './environment.mjs';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

let environment;
try { environment = loadEnvironment(); } catch (e) { console.error(e.message); process.exit(1); }

const [command, ...flags] = environment.args;
const yes = flags.includes('--yes');
const mode = (process.env.APP_MODE || '').toLowerCase();
const testMode = mode === 'test' || mode === 'local' || (mode !== 'supabase' && !process.env.NEXT_PUBLIC_SUPABASE_URL);

const SQL = 'supabase/sql';
const BUSINESS_TABLES = [
  'audit_log', 'messages', 'orders', 'announcement_translations', 'announcements', 'faq_translations', 'faqs',
  'slide_translations', 'slides', 'product_section_translations', 'product_sections', 'product_image_translations',
  'product_images', 'product_translations', 'products', 'category_translations', 'categories',
];

const files = (dir, { seeds = true } = {}) => readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f) && (seeds || !f.endsWith('_seed.sql'))).sort().map((f) => path.join(dir, f));
const ok = (m) => console.log(`  ✔ ${m}`);
const fail = (m) => { console.error(`\n  ✘ ${m}\n`); process.exit(1); };

async function confirm(message) {
  console.log(`\n${message}\n`);
  if (yes) return;
  const rl = createInterface({ input: stdin, output: stdout });
  const a = (await rl.question('  Type YES (in capitals) to continue, anything else cancels: ')).trim();
  rl.close();
  if (a !== 'YES') { console.log('\n  Cancelled. Nothing was changed.\n'); process.exit(0); }
}

/* ───────── test mode (local files) ───────── */
const dataDir = path.resolve(process.env.LOCAL_DATA_DIR || '.data');
function assertLocalTarget() {
  const relative = path.relative(process.cwd(), dataDir);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('LOCAL_DATA_DIR must be a dedicated folder inside this project before a reset or clear is allowed.');
}

async function testSetup() {
  assertLocalTarget();
  await confirm(`TEST MODE - this deletes everything in ${path.relative('.', dataDir) || dataDir} (products, images, orders, admin users...).\n  Fresh sample data is created the next time the site starts, and you will need to create an admin again.`);
  rmSync(dataDir, { recursive: true, force: true });
  ok('Local data removed. Sample data will be created on the next start.');
  console.log('\n  Next: run create-admin.bat to add your admin login.\n');
}

async function testClear() {
  assertLocalTarget();
  const file = path.join(dataDir, 'db.json');
  await confirm('TEST MODE - this deletes products, categories, slides, FAQs, announcements, orders, messages, audit history and all uploaded images.\n  Admin users, roles, privileges, languages and settings are kept.');
  if (existsSync(file)) {
    const db = JSON.parse(readFileSync(file, 'utf8'));
    for (const t of BUSINESS_TABLES) if (db[t]) db[t] = [];
    for (const row of db.site_settings ?? []) Object.assign(row.data, { hero_background_url: '', hero_background_path: '' });
    writeFileSync(file, JSON.stringify(db));
  }
  rmSync(path.join(dataDir, 'uploads'), { recursive: true, force: true });
  ok('Shop data cleared.');
}

/* ───────── supabase mode ───────── */
function supabaseClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY, db = process.env.SUPABASE_DB_URL;
  if (!url || !key) fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local.');
  if (!db) {
    fail('SUPABASE_DB_URL is not set in .env.local.\n  Add it (Supabase > Project Settings > Database > Connection string > URI),\n  or run the files in supabase/sql by hand in the Supabase SQL Editor, in numbered order.');
  }
  const uri = new URL(db);
  if (uri.hostname.endsWith('.pooler.supabase.com') && uri.port === '6543') throw new Error('Database migrations need the Session pooler (port 5432), not the Transaction pooler (port 6543). Copy the Session pooler URI from Supabase → Connect.');
  const ref = new URL(url).hostname.split('.')[0];
  const dbRef = uri.hostname.startsWith('db.') ? uri.hostname.split('.')[1] : decodeURIComponent(uri.username).split('.')[1];
  if (dbRef && dbRef !== ref) throw new Error('The database URI and Supabase API URL refer to different projects. Check the selected configuration before continuing.');
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) uri.searchParams.delete(key);
  return { sb: createClient(url, key, { auth: { persistSession: false } }), pgc: new pg.Client({ connectionString: uri.toString(), connectionTimeoutMillis: 8000, query_timeout: 60000, ssl: { rejectUnauthorized: true, ...(process.env.SUPABASE_DB_CA_CERT ? { ca: readFileSync(process.env.SUPABASE_DB_CA_CERT, 'utf8') } : {}) } }) };
}

export function connectionMessage(error) {
  const codes = [error.code, ...(error.errors ?? []).map((e) => e.code)];
  if (codes.some((c) => ['ETIMEDOUT', 'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH', 'ENOTFOUND'].includes(c)) || /timeout/i.test(error.message || '')) return 'The database could not be reached. No database changes were made.\n  Check that the Supabase project is running, then copy its Session pooler URI (IPv4, port 5432) into SUPABASE_DB_URL.\n  Check your firewall, VPN and network allow database connections. If this network blocks port 5432, use another network or run the SQL files in the Supabase SQL Editor.\n  Changing an application setting cannot unblock a network port.';
  if (codes.includes('28P01')) return 'Database sign-in failed. Check the database password in SUPABASE_DB_URL (it is not the API key). URL-encode special characters in the password.';
  if (/certificate|self.signed/i.test(error.message || '')) return 'The database certificate could not be verified. Download the database CA certificate from Supabase and set SUPABASE_DB_CA_CERT to its file path.';
  return `Database operation failed (${error.code || 'unknown error'}). Check the selected configuration and database setup. No credentials were printed.`;
}

async function connect(pgc) {
  try { await pgc.connect(); await pgc.query('select 1'); }
  catch (e) { await pgc.end().catch(() => {}); throw new Error(connectionMessage(e)); }
}

async function runFile(pgc, f) {
  try { await pgc.query(readFileSync(f, 'utf8')); ok(path.basename(f)); }
  catch (e) { throw new Error(`${path.basename(f)} failed (${e.code || 'SQL error'}). The database transaction will be rolled back.`); }
}

async function ensureBucket(sb) {
  const { data } = await sb.storage.getBucket('media');
  if (!data) {
    const { error } = await sb.storage.createBucket('media', { public: true, fileSizeLimit: 8388608, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] });
    if (error) fail(`Could not create the "media" image bucket: ${error.message}`);
    ok('Image bucket "media" created');
  }
}

async function emptyBucket(sb) {
  const { data: bucket } = await sb.storage.getBucket('media');
  if (!bucket) return;
  let removed = 0;
  const walk = async (prefix) => {
    const { data, error } = await sb.storage.from('media').list(prefix, { limit: 1000 });
    if (error) throw new Error('Uploaded images could not be listed. Database changes finished, but storage cleanup did not. Check storage access and retry cleanup.');
    for (const item of data ?? []) {
      const p = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) { const { error } = await sb.storage.from('media').remove([p]); if (error) throw new Error('An uploaded image could not be removed. Database changes finished, but storage cleanup did not.'); removed++; } else await walk(p);
    }
    if ((data?.length ?? 0) === 1000) await walk(prefix);
  };
  await walk('');
  ok(`Uploaded images removed (${removed})`);
}

async function supabaseSetup() {
  const { sb, pgc } = supabaseClients();
  await connect(pgc);
  try {
    await confirm('SUPABASE - this DROPS and rebuilds every table of this project in your database, deletes all uploaded images, then loads the sample data.\n  Admin access records are removed; Supabase Auth accounts remain. Run create-admin.bat afterwards.');
    await pgc.query('begin');
    console.log('\n  Removing old tables');
    await runFile(pgc, `${SQL}/maintenance/drop_all.sql`);
    console.log('\n  Creating tables and loading sample data (numbered order)');
    for (const f of files(SQL)) await runFile(pgc, f);
    await pgc.query('commit');
  } catch (e) { await pgc.query('rollback').catch(() => {}); throw e;
  } finally { await pgc.end(); }
  console.log('\n  Images');
  await ensureBucket(sb);
  await emptyBucket(sb);
  console.log('\n  Done. Next: run create-admin.bat to add your admin login.\n');
}

async function supabaseClear() {
  await confirm('SUPABASE - this deletes products, categories, slides, FAQs, announcements, orders, messages, audit history and all uploaded images.\n  Admin users, roles, privileges, languages and settings are kept.');
  const { sb, pgc } = supabaseClients();
  await connect(pgc);
  try { await pgc.query('begin'); await runFile(pgc, `${SQL}/maintenance/clear_data.sql`); await pgc.query('commit'); }
  catch (e) { await pgc.query('rollback').catch(() => {}); throw e; } finally { await pgc.end(); }
  await emptyBucket(sb);
  console.log('\n  Done.\n');
}

/* ───────── go ───────── */
async function migrate(pgc) {
  // The numbered schema files are the single source for fresh setup and existing databases.
  // Reapply their idempotent definitions, without running reset scripts or sample-data seeds.
  for (const f of files(SQL, { seeds: false })) await runFile(pgc, f);
}

console.log(`\n  Maison Jawaher - Environment: ${environment.name} - ${testMode ? 'TEST mode (local files)' : 'SUPABASE mode'}`);
try {
  if (command === 'setup') await (testMode ? testSetup() : supabaseSetup());
  else if (command === 'clear') await (testMode ? testClear() : supabaseClear());
  else if (['check', 'migrate'].includes(command)) {
    if (testMode) ok('Local test mode is active; no Supabase connection or migration is needed.');
    else {
      const { pgc } = supabaseClients(); await connect(pgc);
      try {
        if (command === 'migrate') { await confirm(`${environment.name.toUpperCase()} - applies the schema files to this database. Existing data is kept; sample data is not loaded.`); await pgc.query('begin'); await migrate(pgc); await pgc.query('commit'); }
        ok(command === 'check' ? 'Database connection is working. No data was changed.' : 'Numbered schema files applied. Existing data was kept; sample data was not loaded.');
      } catch (e) { await pgc.query('rollback').catch(() => {}); throw e; } finally { await pgc.end(); }
    }
  } else fail('Usage: node scripts/db.mjs setup|clear|check|migrate [--env dev|prod] [--yes]');
} catch (e) { console.error(`\n  ✘ ${e.message}\n`); process.exitCode = 1; }
