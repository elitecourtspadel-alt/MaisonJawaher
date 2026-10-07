import { ADMIN_PATH } from '@/lib/admin-path';
import { notFound } from 'next/navigation';
import { requirePrivilege } from '@/lib/admin-auth';
import { loadEditPage } from '@/lib/admin/pages';
import { saveCategory } from '../../../actions/content';
import { EntityForm } from '@/components/admin/entity-form';
import type { FieldDef } from '@/components/admin/lang-fields';

export const metadata = { title: 'Category' };

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
];
const seoFields: FieldDef[] = [
  { key: 'seo_title', label: 'Search title' },
  { key: 'seo_description', label: 'Search description', kind: 'textarea', rows: 2 },
];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePrivilege('categories');
  const page = await loadEditPage('categories', 'category_translations', id, [...fields, ...seoFields].map((f) => f.key));
  if ('missing' in page) notFound();
  const c = page.row;
  return (
    <EntityForm key={id} module="categories" base={`${ADMIN_PATH}/categories`} noun="category" plural="categories" languages={page.languages}
      fields={fields} seoFields={seoFields} imageFolder="categories" hasSlug save={saveCategory}
      initial={{ id: c?.id, slug: c?.slug ?? '', image_url: c?.image_url ?? null, image_path: c?.image_path ?? null, sort_order: c?.sort_order ?? 0, is_active: c?.is_active ?? true, translations: page.translations }} />
  );
}
