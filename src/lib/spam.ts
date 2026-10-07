import 'server-only';
import { headers } from 'next/headers';

const hits = new Map<string, number[]>();

/** Tiny in-memory sliding-window limiter (per server instance). */
export async function rateLimit(bucket: string, max: number, windowMs: number) {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'local').split(',')[0].trim();
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return false; }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

/**
 * Bot heuristics: the hidden trap field must be empty and the form must have been open for at least 2.5 seconds.
 * A rejected submission is dropped silently (the visitor sees "sent"), so the reason is logged to find false alarms.
 */
export function looksLikeBot(fd: FormData) {
  const ts = Number(fd.get('_ts'));
  const reason = String(fd.get('contact_alt') ?? '').trim() !== '' ? 'trap field filled'
    : !ts ? 'no timestamp (submitted before the page finished loading)'
    : Date.now() - ts < 2500 ? 'submitted too fast'
    : Date.now() - ts > 1000 * 60 * 60 * 6 ? 'form open for over 6 hours' : '';
  if (reason) console.warn(`[spam] form submission dropped: ${reason}`);
  return !!reason;
}
