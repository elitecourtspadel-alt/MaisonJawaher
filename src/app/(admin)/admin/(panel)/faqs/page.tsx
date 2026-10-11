import { ADMIN_PATH } from '@/lib/admin-path';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePrivilege } from '@/lib/admin-auth';
import { flatten } from '@/lib/translations';
import { loadLanguages } from '@/lib/admin/translations';
import { nameIn } from '@/lib/admin/pages';
import type { Faq } from '@/lib/types';
import { deleteFaq, toggleFaq } from '../../actions/content';
import { SimpleList } from '@/components/admin/simple-list';

export const metadata = { title: 'FAQs' };

export default async function Page() {
  await requirePrivilege('faqs');
  const sb = createAdminClient();
  const [{ data }, languages] = await Promise.all([sb.from('faqs').select('*, faq_translations(*)').order('sort_order'), loadLanguages(sb)]);
  const items = (flatten(data ?? []) as Faq[]).map((f) => ({ id: f.id, title: nameIn(f.translations, 'question', languages), active: f.is_active, subtitle: `Order ${f.sort_order}` }));
  return (
    <SimpleList module="faqs" base={`${ADMIN_PATH}/faqs`} noun="question" plural="questions" title="FAQs"
      description="Questions and answers shown on the home page and on Our Story."
      items={items} emptyText="No questions yet." toggle={toggleFaq} remove={deleteFaq} />
  );
}
