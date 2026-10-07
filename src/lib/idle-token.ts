import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export type IdleToken = { uid: string; sid: string; last: number; started: number };
export const ABSOLUTE_SESSION_MS = 12 * 60 * 60 * 1000;
export function newIdleToken(uid: string, now = Date.now()): IdleToken { return { uid, sid: randomUUID(), last: now, started: now }; }
export function encodeIdleToken(token: IdleToken, secret: string) {
  const payload = Buffer.from(JSON.stringify(token)).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
}
export function decodeIdleToken(raw: string, secret: string): IdleToken | null {
  const parts = raw.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const token = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof token.uid === 'string' && typeof token.sid === 'string' && Number.isFinite(token.last) && Number.isFinite(token.started) ? token : null;
  } catch { return null; }
}
export function idleDeadline(token: IdleToken, minutes: number) { return Math.min(token.last + minutes * 60_000, token.started + ABSOLUTE_SESSION_MS); }
export function validIdleToken(token: IdleToken | null, uid: string, minutes: number, now = Date.now()) {
  return !!token && token.uid === uid && token.started <= token.last && token.last <= now && now < idleDeadline(token, minutes);
}
