import { createAdminClient } from '@/lib/supabase/server';
import { requirePrivilege } from '@/lib/admin-auth';
import { getSettings } from '@/lib/settings';
import { flatten } from '@/lib/translations';
import { loadLanguages } from '@/lib/admin/translations';
import { nameIn } from '@/lib/admin/pages';
import type { Product } from '@/lib/types';
import { ProductsList } from '@/components/admin/products-list';

export const metadata = { title: 'Products' };

export default async function Page() {
  await requirePrivilege('products');
  const sb = createAdminClient();
  const [{ data }, s, languages] = await Promise.all([
    sb.from('products').select('*, product_translations(*), product_images(*), categories(id, slug, is_active, category_translations(*))').order('created_at', { ascending: false }),
    getSettings(),
    loadLanguages(sb),
  ]);
  const rows = (flatten(data ?? []) as Product[]).map((p) => ({
    id: p.id, name: nameIn(p.translations, 'name', languages) || '(no name)',
    image: [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
    category: p.categories ? nameIn(p.categories.translations, 'name', languages) : '', categoryOff: !!p.categories && !p.categories.is_active,
    sku: p.sku, price: p.price, showPrice: p.show_price, active: p.is_active, featured: p.is_featured, isNew: p.is_new,
  }));
  return <ProductsList products={rows} currency={s.currency} />;
}
