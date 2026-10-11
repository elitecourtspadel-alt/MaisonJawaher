import { ADMIN_PATH } from '@/lib/admin-path';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/admin-auth';
import { isConfigured } from '@/lib/supabase/server';
import { isTestMode } from '@/lib/mode';
import { LoginForm } from '@/components/admin/login-form';
import { backendMessage, getBackendStatus } from '@/lib/backend-status';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const status = await getBackendStatus();
  const usable = status === 'ready' || status === 'empty';
  if (usable && isConfigured() && (await getAdmin())) redirect(`${ADMIN_PATH}`);
  const { reason } = await searchParams;
  const settings = await getSettings();
  return <LoginForm trustedDays={settings.admin_trusted_device_days} trustEnabled={settings.admin_trusted_devices_enabled} configured={usable && isConfigured()} testMode={isTestMode()} setupMessage={usable ? '' : backendMessage(status)} notice={reason === 'password-changed' ? 'Your permanent password is ready. Sign in with it below. If you use two-factor authentication, you will still be asked for your code.' : ''} />;
}
