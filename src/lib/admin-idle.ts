import { ADMIN_PATH } from '@/lib/admin-path';
import 'server-only';
import { cookies } from 'next/headers';
import { isTestMode } from './mode';
import { decodeIdleToken, encodeIdleToken, newIdleToken, type IdleToken } from './idle-token';

const COOKIE = 'mj_admin_activity';
function secret() {
  const value = process.env.APP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (value) return value;
  if (isTestMode()) return 'insecure-dev-secret';
  throw new Error('Set APP_SECRET to enable secure admin sessions.');
}
export async function readAdminIdle() { return decodeIdleToken((await cookies()).get(COOKIE)?.value || '', secret()); }
export async function writeAdminIdle(token: IdleToken) {
  (await cookies()).set(COOKIE, encodeIdleToken(token, secret()), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https'), path: `${ADMIN_PATH}`, maxAge: 12 * 60 * 60 });
}
export async function startAdminIdle(uid: string) { await writeAdminIdle(newIdleToken(uid)); }
export async function clearAdminIdle() { (await cookies()).set(COOKIE, '', { path: `${ADMIN_PATH}`, maxAge: 0 }); }
