import { ADMIN_PATH } from '@/lib/admin-path';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePrivilege } from '@/lib/admin-auth';
import { flatten } from '@/lib/translations';
import { loadLanguages } from '@/lib/admin/translations';
import { nameIn } from '@/lib/admin/pages';
import type { Category } from '@/lib/types';
import { deleteCategory, toggleCategory } from '../../actions/content';
import { SimpleList } from '@/components/admin/simple-list';

export const metadata = { title: 'Categories' };

export default async function Page() {
  await requirePrivilege('categories');
  const sb = createAdminClient();
  const [{ data }, { data: prods }, languages] = await Promise.all([
    sb.from('categories').select('*, category_translations(*)').order('sort_order'),
    sb.from('products').select('category_id'),
    loadLanguages(sb),
  ]);
  const counts = new Map<string, number>();
  for (const p of prods ?? []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);

  const items = (flatten(data ?? []) as Category[]).map((c) => {
    const n = counts.get(c.id) ?? 0;
    const name = nameIn(c.translations, 'name', languages);
    return {
      id: c.id, title: name, image: c.image_url, active: c.is_active,
      subtitle: `${n} ${n === 1 ? 'product' : 'products'} · /${c.slug}`,
      lockedReason: n ? `This category still has ${n} ${n === 1 ? 'product' : 'products'}. Move or delete ${n === 1 ? 'it' : 'them'} first.` : undefined,
      offWarning: n ? `${n === 1 ? 'Its 1 product' : `Its ${n} products`} will be hidden from the website while this category is off.` : undefined,
    };
  });
  return (
    <SimpleList module="categories" base={`${ADMIN_PATH}/categories`} noun="category" plural="categories" title="Categories"
      description="Group your products. Turning a category off also hides its products from the website."
      items={items} emptyText="No categories yet. Add one before you add products." toggle={toggleCategory} remove={deleteCategory} />
  );
}
