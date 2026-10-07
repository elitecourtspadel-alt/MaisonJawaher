import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getDb } from './db';

const COOKIE = 'mj_local_session';
const secret = () => process.env.APP_SECRET ?? 'insecure-dev-secret';

export function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('base64')}$${scryptSync(pw, salt, 64).toString('base64')}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [alg, s, h] = stored.split('$');
  if (alg !== 'scrypt' || !s || !h) return false;
  const a = scryptSync(pw, Buffer.from(s, 'base64'), 64), b = Buffer.from(h, 'base64');
  return a.length === b.length && timingSafeEqual(a, b);
}

type Sess = { uid: string; aal: 1 | 2; exp: number; iat?: number };
const sign = (p: string) => createHmac('sha256', secret()).update(p).digest('base64url');

export async function setLocalSession(uid: string, aal: 1 | 2) {
  const payload = Buffer.from(JSON.stringify({ uid, aal, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 12 } satisfies Sess)).toString('base64url');
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https'), path: '/', maxAge: 60 * 60 * 12 });
}
export async function clearLocalSession() { (await cookies()).delete(COOKIE); }

export async function readLocalSession(): Promise<Sess | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  const good = sign(payload);
  if (good.length !== sig.length || !timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  try { const s = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Sess; const u = findLocalUser(s.uid); if (u?.password_changed_at && (!s.iat || s.iat < Date.parse(u.password_changed_at))) return null; return s.exp > Date.now() ? s : null; } catch { return null; }
}

export const findLocalUser = (id: string) => getDb().app_users.find((u) => u.id === id);
export const findLocalUserByEmail = (email: string) => getDb().app_users.find((u) => u.email === email.trim().toLowerCase());
export const isLocalAdmin = (id: string) => getDb().user_roles.some((r) => r.user_id === id && r.is_active);
