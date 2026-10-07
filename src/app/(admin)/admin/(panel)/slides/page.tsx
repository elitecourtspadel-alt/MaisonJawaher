import { ADMIN_PATH } from '@/lib/admin-path';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePrivilege } from '@/lib/admin-auth';
import { flatten } from '@/lib/translations';
import { loadLanguages } from '@/lib/admin/translations';
import { nameIn } from '@/lib/admin/pages';
import type { Slide } from '@/lib/types';
import { deleteSlide, toggleSlide } from '../../actions/content';
import { SimpleList } from '@/components/admin/simple-list';

export const metadata = { title: 'Collection slides' };

export default async function Page() {
  await requirePrivilege('slides');
  const sb = createAdminClient();
  const [{ data }, languages] = await Promise.all([sb.from('slides').select('*, slide_translations(*)').order('sort_order'), loadLanguages(sb)]);
  const items = (flatten(data ?? []) as Slide[]).map((s) => ({
    id: s.id, title: nameIn(s.translations, 'title', languages) || 'Slide without a title', image: s.image_url, active: s.is_active, subtitle: `Order ${s.sort_order}`,
  }));
  return (
    <SimpleList module="slides" base={`${ADMIN_PATH}/slides`} noun="slide" plural="slides" title="Collection slides"
      description="The Collection Edit on the home page, between new arrivals and shopping categories."
      items={items} emptyText="No collection slides yet. Add a photo to show The Collection Edit on the home page."
      toggle={toggleSlide} remove={deleteSlide} />
  );
}
