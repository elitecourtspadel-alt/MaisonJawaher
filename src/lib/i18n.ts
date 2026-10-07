import en, { type Dict } from '@/messages/en';
import fr from '@/messages/fr';
import { pickTr } from './translations';
import type { Tr } from './types';

/**
 * Languages the public site has a UI dictionary for. Content (products, categories...) can be written in any
 * language listed in the `languages` table; to publish a new language add its dictionary under src/messages
 * and add its code here.
 */
export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

/**
 * Countries where French is an official or everyday language. A visitor from one of these sees the French site
 * the first time; everyone else sees English. (Their own choice in the language menu always wins afterwards.)
 */
export const FRENCH_COUNTRIES = new Set([
  'MA', 'DZ', 'TN', 'MR', // Maghreb
  'FR', 'MC', 'BE', 'LU', 'CH', // Europe
  'SN', 'ML', 'BF', 'NE', 'CI', 'GN', 'TG', 'BJ', 'TD', 'CM', 'GA', 'CG', 'CD', 'CF', 'GQ', 'DJ', 'KM', 'MG', 'BI', 'RW', 'SC', // Africa
  'HT', 'GP', 'MQ', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF', 'NC', 'PF', 'WF', 'VU', // Caribbean, Indian Ocean, Pacific
  'LB', // Lebanon
]);

/** Locale suggested by the visitor's country (ISO code), or undefined when the country is unknown. */
export const localeForCountry = (country: string | null | undefined): Locale | undefined => {
  const c = (country ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c) || c === 'XX' || c === 'T1') return undefined; // XX = unknown, T1 = Tor (Cloudflare)
  return FRENCH_COUNTRIES.has(c) ? 'fr' : 'en';
};

export const isLocale = (v: string | undefined): v is Locale => !!v && (locales as readonly string[]).includes(v);
export const getDict = (l: Locale): Dict => (l === 'fr' ? fr : en);

/** A translated field of a database row, in the visitor's language (falls back to the default, then to anything). */
export function loc(row: { translations?: Tr[] } | null | undefined, key: string, locale: string): string {
  return pickTr(row?.translations, key, locale, defaultLocale);
}

/** A value that exists once per language, such as { en: "...", fr: "..." }. */
export function text(map: Record<string, string> | undefined, locale: string): string {
  return map?.[locale] || map?.[defaultLocale] || Object.values(map ?? {}).find(Boolean) || '';
}

export const href = (locale: Locale, path = '') => `/${locale}${path === '/' ? '' : path}`;

export function formatPrice(value: number | string | null | undefined, locale: Locale, currency = 'MAD') {
  const n = Number(value ?? 0);
  const num = new Intl.NumberFormat(locale === 'fr' ? 'fr-MA' : 'en-US', { maximumFractionDigits: 2 }).format(n);
  return locale === 'fr' ? `${num} ${currency}` : `${currency} ${num}`;
}
