import fs from 'node:fs';
import path from 'node:path';
import { isTestMode } from '@/lib/mode';
import { resolveUpload } from '@/lib/local/db';

const TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };

/** Serves uploaded images in test mode (APP_MODE=test). */
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!isTestMode()) return new Response('Not found', { status: 404 });
  const { path: parts } = await params;
  const file = resolveUpload(parts.join('/'));
  const type = file && TYPES[path.extname(file).toLowerCase()];
  if (!file || !type || !fs.existsSync(file)) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(fs.readFileSync(file)), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
}
