import { cache } from 'react';
import type { Announcement, Category, Faq, Language, Product, Slide } from './types';
import { createPublicClient, isConfigured } from './supabase/server';
import { flatten } from './translations';
import { getBackendStatus } from './backend-status';

const PRODUCT_LIST = '*, product_translations(*), product_images(*, product_image_translations(*)), categories(id, slug, is_active, category_translations(*))';
const PRODUCT_FULL = `${PRODUCT_LIST}, product_sections(*, product_section_translations(*))`;

async function safe<T>(fn: () => PromiseLike<{ data: unknown; error: unknown }>, fallback: T): Promise<T> {
  if (!isConfigured()) return fallback;
  if (['setup', 'unavailable', 'unconfigured'].includes(await getBackendStatus())) return fallback;
  try {
    const { data, error } = await fn();
    if (error) { console.warn('[data] Store data is unavailable.', typeof error === 'object' && error && 'code' in error ? error.code : 'query failed'); return fallback; }
    return data == null ? fallback : (flatten(data) as T);
  } catch { console.warn('[data] Store data could not be loaded.'); return fallback; }
}

const sortChildren = (p: Product): Product => ({
  ...p,
  product_images: [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  product_sections: [...(p.product_sections ?? [])].sort((a, b) => a.sort_order - b.sort_order),
});

export const getLanguages = cache(() =>
  safe<Language[]>(() => createPublicClient().from('languages').select('*').order('sort_order'), []));

export const getSlides = cache(() =>
  safe<Slide[]>(() => createPublicClient().from('slides').select('*, slide_translations(*)').order('sort_order'), []));

export const getCategories = cache(() =>
  safe<Category[]>(() => createPublicClient().from('categories').select('*, category_translations(*)').order('sort_order'), []));

export const getFaqs = cache(() =>
  safe<Faq[]>(() => createPublicClient().from('faqs').select('*, faq_translations(*)').order('sort_order'), []));

export const getAnnouncements = cache(() =>
  safe<Announcement[]>(() => createPublicClient().from('announcements').select('*, announcement_translations(*)').order('sort_order'), []));

export const getProducts = cache(async (opts: { category?: string; featured?: boolean; isNew?: boolean; limit?: number } = {}) => {
  const rows = await safe<Product[]>(() => {
    let q = createPublicClient().from('products').select(PRODUCT_LIST).order('sort_order').order('created_at', { ascending: false });
    if (opts.featured) q = q.eq('is_featured', true);
    if (opts.isNew) q = q.eq('is_new', true);
    if (opts.limit) q = q.limit(opts.limit);
    return q;
  }, []);
  const list = rows.map(sortChildren);
  return opts.category ? list.filter((p) => p.categories?.slug === opts.category) : list;
});

export const getProduct = cache(async (slug: string) => {
  const rows = await safe<Product[]>(() => createPublicClient().from('products').select(PRODUCT_FULL).eq('slug', slug).limit(1), []);
  return rows[0] ? sortChildren(rows[0]) : null;
});
