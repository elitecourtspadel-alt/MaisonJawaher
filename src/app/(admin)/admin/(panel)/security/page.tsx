import { mfaState } from '@/lib/auth-ops';
import { SecurityPanel } from '@/components/admin/security-panel';
import { requireAdmin } from '@/lib/admin-auth';
import { listTrustedDevices, localFactorId, verifiedFactor } from '@/lib/trusted-devices';
import { getSettings } from '@/lib/settings';
import { isTestMode } from '@/lib/mode';
import { findLocalUser } from '@/lib/local/auth';
import { TrustedDevicesPanel } from '@/components/admin/trusted-devices-panel';

export const metadata = { title: 'Security' };

export default async function Page() {
  const { enabled, id } = await mfaState();
  const admin = await requireAdmin();
  const settings = await getSettings();
  const factor = isTestMode() ? findLocalUser(admin.userId)?.totp_secret : id;
  const devices = enabled && factor ? await listTrustedDevices(admin.userId, isTestMode() ? localFactorId(factor) : factor) : [];
  return <div className="grid gap-6"><SecurityPanel enabled={enabled} factorId={id} required={admin.mfaRequired} verified={!!await verifiedFactor(admin.userId)} trustEnabled={settings.admin_trusted_devices_enabled} trustedDays={settings.admin_trusted_device_days} />
    <TrustedDevicesPanel devices={devices} enabled={settings.admin_trusted_devices_enabled} days={settings.admin_trusted_device_days} max={settings.admin_max_trusted_devices} />
  </div>;
}
