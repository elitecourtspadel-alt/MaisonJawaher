import type { Tr } from './types';

/**
 * Database rows come back with `category_translations`, `product_translations`, ... arrays.
 * Rename each of them to a plain `translations` array so the rest of the app can treat every
 * translated row the same way.
 */
export function flatten<T>(value: T): T {
  if (Array.isArray(value)) return value.map(flatten) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.endsWith('_translations') && Array.isArray(v)) out.translations = v;
      else out[k] = flatten(v);
    }
    return out as T;
  }
  return value;
}

/** One field of a row's translations, in the best available language. */
export function pickTr(translations: Tr[] | undefined, field: string, locale: string, fallback = 'fr'): string {
  const list = translations ?? [];
  const hit = list.find((t) => t.locale === locale && t[field]) ?? list.find((t) => t.locale === fallback && t[field]) ?? list.find((t) => t[field]);
  return (hit?.[field] as string) ?? '';
}

/** { locale: { field: value } } from a translations array (used by the admin forms). */
export function toMap(translations: Tr[] | undefined, fields: string[], locales: string[]): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const l of locales) {
    const row = (translations ?? []).find((t) => t.locale === l);
    out[l] = Object.fromEntries(fields.map((f) => [f, (row?.[f] as string) ?? '']));
  }
  return out;
}
