import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadEnvironment } from './environment.mjs';

try {
  const config = loadEnvironment();
  const [command, ...args] = config.args;
  if (!['dev', 'build', 'start'].includes(command)) throw new Error('Use dev, build or start.');
  const signature = createHash('sha256').update(`${config.name}|${process.env.APP_MODE}|${process.env.NEXT_PUBLIC_SUPABASE_URL}|${process.env.NEXT_PUBLIC_SITE_URL}`).digest('hex');
  const stamp = path.resolve('.next/app-environment.json');
  if (command === 'start' && existsSync(stamp) && JSON.parse(readFileSync(stamp, 'utf8')).signature !== signature) throw new Error('This build belongs to a different configuration. Build again with the selected --env before starting it.');
  console.log(`Maison Jawaher · Environment: ${config.name} · Mode: ${process.env.APP_MODE || 'automatic'}`);
  const child = spawn(process.execPath, [path.resolve('node_modules/next/dist/bin/next'), command, ...(command === 'build' ? [] : ['-p', '3001']), ...args], { stdio: 'inherit', env: process.env });
  child.on('error', () => { console.error('Could not start Next.js. Install project dependencies first.'); process.exitCode = 1; });
  child.on('exit', (code) => {
    if (code === 0 && command === 'build') writeFileSync(stamp, JSON.stringify({ environment: config.name, signature }));
    process.exitCode = code ?? 1;
  });
} catch (e) { console.error(e.message); process.exitCode = 1; }
