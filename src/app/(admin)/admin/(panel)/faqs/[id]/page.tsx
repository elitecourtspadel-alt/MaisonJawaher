import { ADMIN_PATH } from '@/lib/admin-path';
import { notFound } from 'next/navigation';
import { requirePrivilege } from '@/lib/admin-auth';
import { loadEditPage } from '@/lib/admin/pages';
import { saveFaq } from '../../../actions/content';
import { EntityForm } from '@/components/admin/entity-form';
import type { FieldDef } from '@/components/admin/lang-fields';

export const metadata = { title: 'Question' };

const fields: FieldDef[] = [
  { key: 'question', label: 'Question', required: true },
  { key: 'answer', label: 'Answer', kind: 'textarea', rows: 5, required: true },
];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePrivilege('faqs');
  const page = await loadEditPage('faqs', 'faq_translations', id, fields.map((f) => f.key));
  if ('missing' in page) notFound();
  const r = page.row;
  return (
    <EntityForm key={id} module="faqs" base={`${ADMIN_PATH}/faqs`} noun="question" plural="questions" languages={page.languages} fields={fields} save={saveFaq}
      initial={{ id: r?.id, sort_order: r?.sort_order ?? 0, is_active: r?.is_active ?? true, translations: page.translations }} />
  );
}
