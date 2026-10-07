import { timingSafeEqual } from 'node:crypto';
import { createPublicClient } from '@/lib/supabase/server';
import { isTestMode } from '@/lib/mode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ ok: false, error: 'Cron is not configured.' }, { status: 503, headers });
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers });
  if (isTestMode()) return Response.json({ ok: true, skipped: 'Local test mode' }, { headers });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return Response.json({ ok: false, error: 'Supabase is not configured.' }, { status: 503, headers });
  try {
    // A real, uncached Postgres read, using the public key and exposing no catalog data.
    const { error } = await createPublicClient().from('site_settings').select('id').eq('id', 1).limit(1).abortSignal(AbortSignal.timeout(20_000));
    if (error) return Response.json({ ok: false, error: 'Database keep-alive query failed.' }, { status: 502, headers });
    return Response.json({ ok: true, checkedAt: new Date().toISOString() }, { headers });
  } catch { return Response.json({ ok: false, error: 'Database keep-alive query failed.' }, { status: 502, headers }); }
}
