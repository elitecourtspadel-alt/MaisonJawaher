import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createClient } from '@supabase/supabase-js';
import { loadEnvironment } from './environment.mjs';
import { provisionProductionAdmin, PRODUCTION_ADMIN_ROLES } from './production-admin.mjs';

try {
  const environment = loadEnvironment();
  const args = environment.args;
  const value = (name) => { const index = args.indexOf(`--${name}`); return index < 0 ? undefined : args[index + 1]; };
  if (args.includes('--password')) throw new Error('This tool generates a one-time password. Do not supply --password.');
  let email = value('email'), name = value('name'), role = value('role');
  console.log(`\n  Secure admin invitation - ${environment.name.toUpperCase()}\n  2FA is mandatory. The generated password is valid once for 15 minutes.\n  Existing accounts are changed only with --reissue.\n`);
  if (!email || !name || !role) {
    const input = createInterface({ input: stdin, output: stdout });
    try {
      email ||= (await input.question('  Admin email: ')).trim();
      name ||= (await input.question('  Full name: ')).trim();
      if (!role) {
        PRODUCTION_ADMIN_ROLES.forEach((code, i) => console.log(`  ${i + 1}. ${code.replaceAll('_', ' ')}`));
        role = PRODUCTION_ADMIN_ROLES[(Number(await input.question('  Role (1-5, Enter for 1): ')) || 1) - 1];
        if (!role) throw new Error('Choose a role from 1 to 5.');
      }
    } finally { input.close(); stdin.pause(); }
  }
  const client = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : undefined;
  await provisionProductionAdmin({ email, name, role, reissue: args.includes('--reissue'), client });
} catch (error) { console.error(`\n  ${error.message}\n`); process.exitCode = 1; }
