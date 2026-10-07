import { ADMIN_PATH } from '@/lib/admin-path';
import { redirect } from 'next/navigation';
import { getAdmin, getMfaSetupAdmin } from '@/lib/admin-auth';
import { SecurityPanel } from '@/components/admin/security-panel';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { LogoMark } from '@/components/site/logo';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Set up mandatory 2FA' };

export default async function SetupTwoFactorPage() {
  if (await getAdmin()) redirect(`${ADMIN_PATH}`);
  if (!await getMfaSetupAdmin()) redirect(`${ADMIN_PATH}/login`);
  const settings = await getSettings();
  return <main className="admin-auth-background min-h-dvh p-6 sm:p-12">
    <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow)] sm:p-10">
      <div className="mb-8 flex items-center justify-between"><LogoMark className="h-20 text-accent" /><ThemeToggle /></div>
      <SecurityPanel enabled={false} factorId={null} required onboarding trustEnabled={settings.admin_trusted_devices_enabled} trustedDays={settings.admin_trusted_device_days} />
      <a className="mt-6 inline-block text-sm text-muted" href={`${ADMIN_PATH}/login`}>Return to sign in</a>
    </div>
  </main>;
}
