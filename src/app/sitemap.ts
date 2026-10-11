import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/data';
import { locales } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

/** Every page in each language, each entry pointing at its translations (hreflang) so search engines pair them up. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const entry = (path: string, opts: { priority: number; lastModified?: string; changeFrequency?: 'weekly' | 'monthly' | 'daily' }): MetadataRoute.Sitemap =>
    locales.map((l) => ({
      url: `${base}/${l}${path}`, lastModified: opts.lastModified, changeFrequency: opts.changeFrequency ?? 'weekly', priority: opts.priority,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${base}/${x}${path}`])) },
    }));

  return [
    ...entry('', { priority: 1, changeFrequency: 'daily' }),
    ...entry('/shop', { priority: 0.9, changeFrequency: 'daily' }),
    ...entry('/about', { priority: 0.5, changeFrequency: 'monthly' }),
    ...entry('/contact', { priority: 0.5, changeFrequency: 'monthly' }),
    ...entry('/privacy', { priority: 0.2, changeFrequency: 'monthly' }),
    ...entry('/terms', { priority: 0.2, changeFrequency: 'monthly' }),
    ...categories.flatMap((c) => entry(`/shop?category=${c.slug}`, { priority: 0.8, lastModified: c.updated_at })),
    ...products.flatMap((p) => entry(`/product/${p.slug}`, { priority: 0.8, lastModified: p.updated_at })),
  ];
}
