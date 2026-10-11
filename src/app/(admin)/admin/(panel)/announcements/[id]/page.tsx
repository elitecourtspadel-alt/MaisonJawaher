import { ADMIN_PATH } from '@/lib/admin-path';
import { notFound } from 'next/navigation';
import { requirePrivilege } from '@/lib/admin-auth';
import { loadEditPage } from '@/lib/admin/pages';
import { saveAnnouncement } from '../../../actions/content';
import { EntityForm } from '@/components/admin/entity-form';
import type { FieldDef } from '@/components/admin/lang-fields';

export const metadata = { title: 'Announcement' };

const fields: FieldDef[] = [{ key: 'message', label: 'Message', kind: 'textarea', rows: 2, required: true, hint: 'One short sentence works best.' }];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePrivilege('announcements');
  const page = await loadEditPage('announcements', 'announcement_translations', id, fields.map((f) => f.key));
  if ('missing' in page) notFound();
  const r = page.row;
  return (
    <EntityForm key={id} module="announcements" base={`${ADMIN_PATH}/announcements`} noun="announcement" plural="announcements" languages={page.languages} fields={fields} save={saveAnnouncement}
      initial={{ id: r?.id, sort_order: r?.sort_order ?? 0, is_active: r?.is_active ?? true, translations: page.translations }} />
  );
}
