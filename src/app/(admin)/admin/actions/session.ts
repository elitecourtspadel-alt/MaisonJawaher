'use server';
import { getAdmin } from '@/lib/admin-auth';
import { readAdminIdle, writeAdminIdle } from '@/lib/admin-idle';
import { idleDeadline } from '@/lib/idle-token';
import { getSettings } from '@/lib/settings';
import { signOut } from '@/lib/auth-ops';

export async function renewAdminActivity() {
  const admin = await getAdmin();
  const token = await readAdminIdle();
  if (!admin || !token) return { ok: false as const };
  const settings = await getSettings();
  const next = { ...token, last: Date.now() };
  await writeAdminIdle(next);
  return { ok: true as const, deadline: idleDeadline(next, settings.admin_idle_timeout_minutes) };
}
export async function expireAdminSession() {
  // Another tab may have renewed the cookie while this tab was asleep.
  const admin = await getAdmin();
  if (admin) return { expired: false as const, deadline: admin.idleDeadline };
  await signOut();
  return { expired: true as const };
}
