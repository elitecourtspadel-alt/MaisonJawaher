import { z } from 'zod';
import { Denied } from './guard';

export type Result<T = object> = ({ ok: true; warning?: string } & T) | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

/** Turns a thrown error into a friendly result. */
export function fail(e: unknown): Result<never> {
  if (e instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[String(i.path[0] ?? '_')] ??= i.message;
    return { ok: false, error: Object.values(fieldErrors)[0] ?? 'Some of the details are not valid.', fieldErrors };
  }
  if (e instanceof Denied) return { ok: false, error: e.message };
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === 'Unauthorized') return { ok: false, error: 'Your session has ended. Please sign in again.' };
  console.error('[admin action]', e);
  return { ok: false, error: msg };
}

/** A unique-key clash (for example a slug that is already used) becomes a field error. */
export function dbError(error: { message: string; code?: string } | null, field = 'slug'): Result<never> | null {
  if (!error) return null;
  if (error.code === '23505') return { ok: false, error: 'That web address is already used by something else.', fieldErrors: { [field]: 'Already in use. Choose another.' } };
  if (error.code === '23503') return { ok: false, error: 'This is still being used by something else, so it cannot be removed.' };
  return { ok: false, error: error.message };
}

/** Image URLs: a full https URL (Supabase) or our own local path (test mode). */
export const imageUrl = (message = 'The photo is not valid') =>
  z.string({ error: message }).trim().refine((v) => /^https?:\/\//.test(v) || v.startsWith('/api/local-media/'), message);

export const num = z
  .union([z.number(), z.string(), z.null()])
  .transform((v) => (v === '' || v === null ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), 'Enter a number that is zero or more');

export const trSchema = z.record(z.string(), z.record(z.string(), z.string())).default({});
