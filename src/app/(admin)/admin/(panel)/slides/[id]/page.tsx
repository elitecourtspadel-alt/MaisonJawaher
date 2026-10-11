import { ADMIN_PATH } from '@/lib/admin-path';
import { notFound } from 'next/navigation';
import { requirePrivilege } from '@/lib/admin-auth';
import { loadEditPage } from '@/lib/admin/pages';
import { saveSlide } from '../../../actions/content';
import { EntityForm } from '@/components/admin/entity-form';
import type { FieldDef } from '@/components/admin/lang-fields';

export const metadata = { title: 'Collection slide' };

const fields: FieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'subtitle', label: 'Subtitle' },
  { key: 'cta_label', label: 'Button text', hint: 'Leave empty for a slide without a button.' },
];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePrivilege('slides');
  const page = await loadEditPage('slides', 'slide_translations', id, fields.map((f) => f.key));
  if ('missing' in page) notFound();
  const s = page.row;
  return (
    <EntityForm key={id} module="slides" base={`${ADMIN_PATH}/slides`} noun="slide" plural="slides" languages={page.languages}
      fields={fields} imageFolder="slides" imageRequired hasLink save={saveSlide}
      initial={{ id: s?.id, image_url: s?.image_url ?? null, image_path: s?.image_path ?? null, cta_url: s?.cta_url ?? '', sort_order: s?.sort_order ?? 0, is_active: s?.is_active ?? true, translations: page.translations }} />
  );
}
