import { requirePrivilege } from '@/lib/admin-auth';
import { getSettings } from '@/lib/settings';
import { HomeHeroForm } from '@/components/admin/home-hero-form';

export const metadata = { title: 'Home hero' };

export default async function Page() {
  await requirePrivilege('settings');
  return <HomeHeroForm settings={await getSettings()} />;
}
