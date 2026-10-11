import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';

export function loadEnvironment(args = process.argv.slice(2), root = process.cwd(), env = process.env) {
  if (args.filter((arg) => arg === '--env').length > 1) throw new Error('Choose only one --env value. Multiple environment selections are not allowed.');
  const flag = args.indexOf('--env');
  const local = path.join(root, '.env.local');
  const legacy = existsSync(local) ? parse(readFileSync(local)) : {};
  const profile = flag >= 0 ? args[flag + 1] : env.APP_ENV || legacy.APP_ENV;
  if (flag >= 0 && !profile) throw new Error('Choose an environment after --env, for example --env dev.');
  if (profile && !/^[a-z][a-z0-9_-]{0,31}$/.test(profile)) throw new Error('Environment names must use lowercase letters, numbers, underscores or hyphens.');
  const file = profile ? path.join(root, 'config', `${profile}.env`) : local;
  if (profile && !existsSync(file) && !env.VERCEL) throw new Error(`Configuration not found: config/${profile}.env. Copy its .example file and fill in the settings.`);
  const selected = existsSync(file) ? parse(readFileSync(file)) : {};
  if (profile) {
    // Prevent Next's automatic .env loading from filling gaps with another project's credentials.
    const keys = new Set([...Object.keys(legacy), ...Object.keys(selected)]);
    for (const name of ['.env.example', '.env', '.env.development', '.env.development.local', '.env.production', '.env.production.local']) {
      const p = path.join(root, name);
      if (existsSync(p)) for (const key of Object.keys(parse(readFileSync(p)))) keys.add(key);
    }
    for (const key of keys) if (env[key] === undefined) env[key] = selected[key] ?? '';
  } else for (const [key, value] of Object.entries(selected)) if (env[key] === undefined) env[key] = value;
  if (profile) env.APP_ENV = profile;
  return { name: profile || 'local', file: profile ? `config/${profile}.env` : '.env.local', args: flag >= 0 ? args.filter((_, i) => i !== flag && i !== flag + 1) : args };
}
