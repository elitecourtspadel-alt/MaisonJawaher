import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { AdminSession } from '../admin-auth';
import type { Language } from '../types';

export type TrInput = Record<string, Record<string, string>>;

/** Active languages, default first. */
export async function loadLanguages(sb: SupabaseClient): Promise<Language[]> {
  const { data } = await sb.from('languages').select('*').eq('is_active', true).order('sort_order');
  return ((data ?? []) as Language[]).sort((a, b) => Number(b.is_default) - Number(a.is_default) || a.sort_order - b.sort_order);
}

/**
 * Validates submitted wording: every key must be an active language, every value a short string, and the
 * default language must have a value for each required field.
 */
export function checkTranslations(input: unknown, languages: Language[], fields: Record<string, { max: number; required?: boolean; label: string }>): { ok: true; value: TrInput } | { ok: false; errors: Record<string, string> } {
  const shape = z.record(z.string(), z.record(z.string(), z.string()));
  const parsed = shape.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, errors: { _: 'The text could not be read.' } };
  const codes = new Set(languages.map((l) => l.code));
  const def = languages.find((l) => l.is_default) ?? languages[0];
  const value: TrInput = {};
  const errors: Record<string, string> = {};
  for (const [locale, vals] of Object.entries(parsed.data)) {
    if (!codes.has(locale)) continue;
    value[locale] = {};
    for (const [f, spec] of Object.entries(fields)) {
      const v = (vals[f] ?? '').trim();
      if (v.length > spec.max) errors[`${locale}.${f}`] = `${spec.label} is too long (max ${spec.max} characters).`;
      value[locale][f] = v;
    }
  }
  if (def) for (const [f, spec] of Object.entries(fields)) if (spec.required && !value[def.code]?.[f]) errors[`${def.code}.${f}`] = `${spec.label} is required in ${def.name}.`;
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

/**
 * Saves wording for one parent row. For each language: update the existing row, create a new one,
 * or remove it when every field was cleared.
 */
export async function saveTranslations(sb: SupabaseClient, table: string, fk: string, parentId: string, input: TrInput, fields: string[], admin: AdminSession) {
  const { data: existing } = await sb.from(table).select('*').eq(fk, parentId);
  const rows = (existing ?? []) as { id: string; locale: string }[];
  for (const [locale, vals] of Object.entries(input)) {
    const values = Object.fromEntries(fields.map((f) => [f, vals[f] ?? '']));
    const empty = Object.values(values).every((v) => !v);
    const row = rows.find((r) => r.locale === locale);
    if (row && empty) await sb.from(table).delete().eq('id', row.id);
    else if (row) await sb.from(table).update({ ...values, updated_by: admin.userId }).eq('id', row.id);
    else if (!empty) await sb.from(table).insert({ [fk]: parentId, locale, ...values, created_by: admin.userId, updated_by: admin.userId });
  }
}
