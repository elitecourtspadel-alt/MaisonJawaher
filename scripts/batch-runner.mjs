import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import path from 'node:path';
import { loadEnvironment } from './environment.mjs';

const operations = {
  'admin-production': { title: 'CREATE A SECURE PRODUCTION ADMIN', script: 'create-admin-production.mjs', args: [], details: ['Creates an admin with mandatory two-factor authentication.', 'Generates a one-time password valid for 15 minutes.', 'Emails the invitation when SMTP is configured; otherwise displays the password.', 'The admin must choose a permanent password and verify 2FA before portal access.', 'Existing accounts are unchanged unless you explicitly supply --reissue.', 'With --reissue, the password and role are replaced; verified 2FA is kept.'] },
  start: { title: 'START THE LOCAL WEBSITE', script: 'run-app.mjs', args: ['dev'], details: ['Starts the local preview at http://localhost:3001.', 'Keep this window open. Press Ctrl+C to stop the server.', 'In Supabase mode, admin changes and customer orders use the selected database.'] },
  admin: { title: 'CREATE OR UPDATE AN ADMIN', script: 'create-admin.mjs', args: [], details: ['Creates a portal administrator with the email and role you choose.', 'Using an existing email resets that person\'s password and role.', 'Supabase mode requires the database tables and roles to be set up first.'] },
  setup: { title: 'FRESH DATABASE SETUP', script: 'db.mjs', args: ['setup'], details: ['DESTRUCTIVE: removes this project\'s current data and uploaded images.', 'Rebuilds the numbered schema and seed files (supabase/sql) and loads sample data.', 'Removes admin access records. Run create-admin.bat afterwards.', 'In Supabase mode, Auth accounts remain; in test mode, local admin accounts are removed.', 'Back up important data first. A separate YES confirmation is still required.'] },
  clear: { title: 'CLEAR SHOP DATA', script: 'db.mjs', args: ['clear'], details: ['DESTRUCTIVE: removes products, categories, collection slides, FAQs,', 'announcements, orders, messages, audit history and uploaded images.', 'Keeps administrators, roles, privileges, languages and other settings.', 'Clears the home-hero photo because its uploaded file is removed.', 'No sample data is loaded. A separate YES confirmation is still required.'] },
};

try {
  const requested = process.argv.slice(2);
  if (requested[0] === 'admin-production' && !requested.includes('--env')) requested.push('--env', 'prod');
  const config = loadEnvironment(requested);
  const [action, ...args] = config.args;
  const operation = operations[action];
  if (!operation) throw new Error('Unknown batch operation. Use start, admin, admin-production, setup or clear.');
  const production = /^(prod|production)(?:[-_]|$)/.test(config.name);
  const mode = (process.env.APP_MODE || '').toLowerCase();
  const local = mode === 'test' || mode === 'local' || (mode !== 'supabase' && !process.env.NEXT_PUBLIC_SUPABASE_URL);
  let target = local ? process.env.LOCAL_DATA_DIR || '.data' : 'Supabase URL is not configured';
  if (!local && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try { target = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname; } catch { target = 'Supabase URL is invalid'; }
  }
  console.log(`\n  ============================================================\n  MAISON JAWAHER - ${operation.title}\n  ============================================================\n\n  SELECTED ENVIRONMENT: ${config.name.toUpperCase()}${production ? ' [PRODUCTION]' : ''}\n  Configuration file:  ${config.file}\n  Data source:         ${local ? 'LOCAL TEST FILES' : 'SUPABASE'}\n  Target:              ${target}\n`);
  for (const line of operation.details) console.log(`  ${line}`);
  console.log(`\n  To choose another environment, cancel and run this batch file\n  with --env dev or --env prod. ${action === 'admin-production' ? 'Only the generated temporary password may be shown when SMTP is absent.' : 'Passwords and keys are never shown.'}\n`);

  let approved = !production;
  if (production) {
    console.log('  WARNING: YOU ARE ABOUT TO RUN AGAINST PRODUCTION.\n  This is the production configuration and may affect real users/data.\n  This confirmation is required even when --yes is supplied.\n');
    if (!stdin.isTTY) {
      console.error('  Cancelled: production requires confirmation in an interactive terminal.');
    } else {
      const input = createInterface({ input: stdin, output: stdout });
      try { approved = (await input.question('  Type PRODUCTION exactly to continue; anything else cancels: ')).trim() === 'PRODUCTION'; }
      finally { input.close(); stdin.pause(); }
      if (!approved) console.log('\n  Cancelled. The requested operation was not started.');
    }
  }
  if (!approved) process.exit(2);
  else {
    // Production resets/clears require both environment approval and the existing data-loss approval.
    const forwardedArgs = production && ['setup', 'clear'].includes(action) ? args.filter((arg) => arg !== '--yes') : args;
    const child = spawn(process.execPath, [path.resolve('scripts', operation.script), ...operation.args, ...forwardedArgs], { stdio: 'inherit', env: process.env });
    child.on('error', () => { console.error('\n  Could not start the operation. Check Node.js and the project dependencies.'); process.exitCode = 1; });
    child.on('exit', (code) => {
      process.exitCode = code ?? 1;
      console.log(code === 0 ? '\n  Operation finished. Review the messages above for the result.' : '\n  Operation did not finish successfully. Review the error above before retrying.');
    });
  }
} catch (error) { console.error(`\n  Unable to start: ${error.message}\n  No operation was started. Check the selected configuration.\n`); process.exitCode = 1; }
