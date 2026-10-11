import { requirePrivilege } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { getEmailSettings, getMailConfig } from '@/lib/mail';
import { loadLanguages } from '@/lib/admin/translations';
import { SettingsForm } from '@/components/admin/settings-form';

export const metadata = { title: 'Settings' };

export default async function Page() {
  await requirePrivilege('settings');
  const [settings, email, languages] = await Promise.all([getSettings(), getEmailSettings(), loadLanguages(createAdminClient())]);
  const cfg = getMailConfig();
  return <SettingsForm settings={settings} languages={languages} email={email} mail={{ configured: !!cfg, host: cfg?.host ?? '', from: cfg?.fromEmail ?? '' }} />;
}
