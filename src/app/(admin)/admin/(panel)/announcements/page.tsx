import { ADMIN_PATH } from '@/lib/admin-path';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePrivilege } from '@/lib/admin-auth';
import { flatten } from '@/lib/translations';
import { loadLanguages } from '@/lib/admin/translations';
import { nameIn } from '@/lib/admin/pages';
import type { Announcement } from '@/lib/types';
import { deleteAnnouncement, toggleAnnouncement } from '../../actions/content';
import { SimpleList } from '@/components/admin/simple-list';

export const metadata = { title: 'Announcements' };

export default async function Page() {
  await requirePrivilege('announcements');
  const sb = createAdminClient();
  const [{ data }, languages] = await Promise.all([sb.from('announcements').select('*, announcement_translations(*)').order('sort_order'), loadLanguages(sb)]);
  const items = (flatten(data ?? []) as Announcement[]).map((a) => ({ id: a.id, title: nameIn(a.translations, 'message', languages), active: a.is_active, subtitle: `Order ${a.sort_order}` }));
  return (
    <SimpleList module="announcements" base={`${ADMIN_PATH}/announcements`} noun="announcement" plural="announcements" title="Announcements"
      description="Short messages that scroll across the thin bar under the menu on every page. Keep each one to a sentence."
      items={items} emptyText="No announcements yet. The bar stays hidden until at least one is active." toggle={toggleAnnouncement} remove={deleteAnnouncement} />
  );
}
