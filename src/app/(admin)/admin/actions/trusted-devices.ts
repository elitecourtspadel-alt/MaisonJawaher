'use server';
import { ADMIN_PATH } from '@/lib/admin-path';
import { revalidatePath } from 'next/cache';
import { getAdmin } from '@/lib/admin-auth';
import { forgetTrustedDevices, rememberVerifiedDevice, TrustedDeviceLimit } from '@/lib/trusted-devices';
import { audit } from '@/lib/admin/audit';
import { createAdminClient } from '@/lib/supabase/server';

/** Called only after the customer confirms the replacement dialog. Requires a verified 2FA session. */
export async function confirmTrustedDeviceReplacement(confirmed: boolean) {
  if (confirmed !== true) return { ok: false as const, error: 'No device was replaced.' };
  const admin = await getAdmin();
  if (!admin) return { ok: false as const, error: 'Please sign in again.' };
  try {
    await rememberVerifiedDevice(admin.userId, true);
    await audit(createAdminClient(), admin, { action: 'security', entity: 'account', summary: 'Confirmed replacing the least recently used trusted device.' });
    revalidatePath(`${ADMIN_PATH}/security`);
    return { ok: true as const };
  } catch (error) { return { ok: false as const, error: error instanceof TrustedDeviceLimit ? error.message : 'Could not trust this device. Verify a fresh authenticator code and try again.' }; }
}

export async function revokeTrustedDevice(deviceId?: string) {
  const admin = await getAdmin();
  if (!admin) return { ok: false as const, error: 'Please sign in again.' };
  if (deviceId !== undefined && !/^[\da-f-]{36}$/.test(deviceId)) return { ok: false as const, error: 'Choose a valid trusted device.' };
  try {
    await forgetTrustedDevices(admin.userId, deviceId);
    await audit(createAdminClient(), admin, { action: 'security', entity: 'account', summary: deviceId ? 'Removed a trusted device.' : 'Removed all trusted devices.' });
    revalidatePath(`${ADMIN_PATH}/security`);
    return { ok: true as const };
  } catch { return { ok: false as const, error: 'Could not remove the trusted device. Please try again.' }; }
}
