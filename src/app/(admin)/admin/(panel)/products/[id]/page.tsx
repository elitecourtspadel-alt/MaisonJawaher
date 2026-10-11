import { notFound } from 'next/navigation';
import { requirePrivilege } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { flatten, toMap } from '@/lib/translations';
import { loadLanguages } from '@/lib/admin/translations';
import { nameIn } from '@/lib/admin/pages';
import type { Category, Product } from '@/lib/types';
import { ProductForm, type ProductInitial } from '@/components/admin/product-form';

export const metadata = { title: 'Product' };

const MAIN = ['name', 'short_description', 'description', 'material', 'seo_title', 'seo_description'];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePrivilege('products');
  const sb = createAdminClient();
  const languages = await loadLanguages(sb);
  const codes = languages.map((l) => l.code);
  const { data: cats } = await sb.from('categories').select('*, category_translations(*)').order('sort_order');
  const categories = (flatten(cats ?? []) as Category[]).map((c) => ({ id: c.id, name: nameIn(c.translations, 'name', languages), active: c.is_active }));

  let p: Product | null = null;
  if (id !== 'new') {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data } = await sb.from('products').select('*, product_translations(*), product_images(*, product_image_translations(*)), product_sections(*, product_section_translations(*))').eq('id', id).maybeSingle();
    if (!data) notFound();
    p = flatten(data) as Product;
  }

  const initial: ProductInitial = {
    id: p?.id, category_id: p?.category_id ?? '', slug: p?.slug ?? '', sku: p?.sku ?? '',
    price: p?.price != null ? String(p.price) : '', compare_price: p?.compare_price != null ? String(p.compare_price) : '',
    show_price: p?.show_price ?? true, stock: p?.stock ?? 0, track_stock: p?.track_stock ?? false,
    is_featured: p?.is_featured ?? false, is_new: p?.is_new ?? false, is_active: p?.is_active ?? true,
    weight: p?.weight ?? '', dimensions: p?.dimensions ?? '', sort_order: p?.sort_order ?? 0,
    translations: toMap(p?.translations, MAIN, codes),
    images: [...(p?.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((im) => ({
      id: im.id, url: im.url, path: im.path, alt: Object.fromEntries(codes.map((c) => [c, (im.translations.find((t) => t.locale === c)?.alt_text as string) ?? ''])),
    })),
    sections: [...(p?.product_sections ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((s) => ({ id: s.id, translations: toMap(s.translations, ['title', 'body'], codes) })),
  };
  return <ProductForm key={id} initial={initial} languages={languages} categories={categories} />;
}
