'use server';
import { z } from 'zod';
import { rateLimit } from '@/lib/spam';
import * as ops from '@/lib/auth-ops';
import { requestRecovery, setPermanentPassword } from '@/lib/password-recovery';
import { getBackendStatus } from '@/lib/backend-status';
import { after } from 'next/server';
import { isMailConfigured } from '@/lib/mail';
import { isTestMode } from '@/lib/mode';
import { createAdminClient } from '@/lib/supabase/server';

const TOO_MANY = { ok: false as const, error: 'Too many attempts. Please wait a few minutes and try again.' };

export async function loginAction(email: string, password: string) {
  if (['setup', 'unavailable', 'unconfigured'].includes(await getBackendStatus())) return { ok: false as const, error: 'The store is not ready for admin sign-in yet. Please ask the site owner to check the database setup and connection.' };
  if (!(await rateLimit('admin-login', 8, 10 * 60_000))) return TOO_MANY;
  const p = z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).safeParse({ email, password });
  if (!p.success) return { ok: false as const, error: 'Incorrect email or password' };
  try { return await ops.passwordLogin(p.data.email, p.data.password); }
  catch { return { ok: false as const, error: 'Sign-in is temporarily unavailable. Please try again later.' }; }
}

export async function forgotPasswordAction(email: string) {
  if (!(await rateLimit('admin-recovery', 3, 15 * 60_000))) return TOO_MANY;
  const value = z.string().email().max(254).safeParse(email.trim().toLowerCase());
  if (!value.success) return { ok: false as const, error: 'Enter a valid email address.' };
  if (['setup', 'unavailable', 'unconfigured'].includes(await getBackendStatus())) return { ok: false as const, error: 'Account recovery is not available until the store setup and connection are ready.' };
  if (!isMailConfigured()) return { ok: false as const, error: 'Password recovery email is not available yet. Please contact the site owner.' };
  if (!isTestMode()) {
    const { error } = await createAdminClient().from('admin_password_recovery').select('id').limit(1);
    if (error) return { ok: false as const, error: 'Password recovery is not set up yet. Please ask the site owner to apply the latest database migration.' };
  }
  // Equal foreground response for registered and unknown emails; SMTP latency cannot reveal accounts.
  after(async () => { await requestRecovery(value.data); });
  return { ok: true as const, message: 'If this email belongs to an active admin, a temporary password will arrive shortly. It is valid for 15 minutes. Check your spam folder too.' };
}

export async function permanentPasswordAction(password: string, confirmation: string) {
  if (!(await rateLimit('admin-permanent-password', 8, 15 * 60_000))) return TOO_MANY;
  if (password !== confirmation) return { ok: false as const, error: 'The passwords do not match.' };
  if (password.length < 12 || password.length > 128) return { ok: false as const, error: 'Choose a password between 12 and 128 characters.' };
  try { return await setPermanentPassword(password); }
  catch { return { ok: false as const, error: 'The password could not be changed. Please request another temporary password.' }; }
}
export async function loginMfaAction(code: string, trust = false) {
  if (!(await rateLimit('admin-mfa', 10, 10 * 60_000))) return TOO_MANY;
  return ops.mfaLogin(String(code).slice(0, 12), trust === true);
}
export async function logoutAction() { await ops.signOut(); }
export async function mfaBeginAction() { return ops.mfaBegin(); }
export async function mfaConfirmAction(id: string, code: string, trust = false) {
  if (!(await rateLimit('admin-mfa-setup', 10, 10 * 60_000))) return TOO_MANY;
  return ops.mfaConfirm(String(id).slice(0, 80), String(code).slice(0, 12), trust === true);
}
export async function mfaDisableAction(id: string) { return ops.mfaDisable(String(id).slice(0, 80)); }
