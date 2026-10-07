import 'server-only';
import { createAdminClient } from '../supabase/server';
import { flatten, toMap } from '../translations';
import type { Language, Tr } from '../types';
import { loadLanguages } from './translations';

/** Everything an admin edit page needs: the languages and (when editing) the row with its wording. */
export async function loadEditPage(table: string, trTable: string, id: string, trFields: string[]) {
  const sb = createAdminClient();
  const languages: Language[] = await loadLanguages(sb);
  const codes = languages.map((l) => l.code);
  if (id === 'new') return { sb, languages, row: null as null | Record<string, any>, translations: toMap([], trFields, codes) };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { sb, languages, row: null, translations: toMap([], trFields, codes), missing: true as const };
  const { data } = await sb.from(table).select(`*, ${trTable}(*)`).eq('id', id).maybeSingle();
  if (!data) return { sb, languages, row: null, translations: toMap([], trFields, codes), missing: true as const };
  const row = flatten(data as unknown) as Record<string, any> & { translations: Tr[] };
  return { sb, languages, row, translations: toMap(row.translations, trFields, codes) };
}

/** The best name for a row in the main language (used in lists). */
export function nameIn(tr: Tr[] | undefined, field: string, languages: Language[]) {
  const def = languages.find((l) => l.is_default) ?? languages[0];
  return ((tr ?? []).find((t) => t.locale === def?.code)?.[field] as string) || ((tr ?? []).find((t) => t[field])?.[field] as string) || '';
}
