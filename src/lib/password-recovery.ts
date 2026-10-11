import { ADMIN_PATH } from '@/lib/admin-path';
import 'server-only';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { createAdminClient, createSessionClient } from './supabase/server';
import { isTestMode } from './mode';
import { getDb, saveDb } from './local/db';
import { clearLocalSession, hashPassword } from './local/auth';
import { clearAdminIdle } from './admin-idle';
import { isMailConfigured, sendMail } from './mail';
import { recoveryEmail, passwordChangedEmail } from './email/templates';
import { audit } from './admin/audit';
import { forgetTrustedDevices } from './trusted-devices';

export const RECOVERY_MINUTES = 15;
const COOKIE = 'mj_password_recovery';
const secret = () => {
  const key = process.env.APP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key && !isTestMode()) throw new Error('Password recovery is not configured.');
  return key || 'local-recovery-test-secret';
};
const digest = (s: string) => createHmac('sha256', secret()).update(`recovery:${s}`).digest('hex');
const equal = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const options = { httpOnly: true, sameSite: 'lax' as const, path: `${ADMIN_PATH}`, secure: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https') };
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(/\/$/, '');
type Grant = { id: string; token: string; exp: number };

async function adminByEmail(email: string) {
  const sb = createAdminClient();
  const { data: u } = await sb.from('app_users').select('id,email,full_name,is_active').eq('email', email).eq('is_active', true).maybeSingle();
  if (!u) return null;
  const { data: access } = await sb.from('user_roles').select('roles(is_active)').eq('user_id', u.id).eq('is_active', true);
  return access?.some((r: any) => r.roles?.is_active) ? u : null;
}
const localRows = () => getDb().admin_password_recovery ??= [];

export async function requestRecovery(email: string) {
  if (!isMailConfigured()) return { ok: false as const, error: 'Password recovery email is not available yet. Please contact the site owner.' };
  const response = { ok: true as const, message: 'If this email belongs to an active admin, a temporary password will arrive shortly. It is valid for 15 minutes. Check your spam folder too.' };
  try {
    const u = await adminByEmail(email);
    if (!u) return response;
    const temp = `MJ-${randomBytes(18).toString('base64url')}`;
    const hash = digest(temp), expires = new Date(Date.now() + RECOVERY_MINUTES * 60_000).toISOString();
    const sb = createAdminClient();
    if (isTestMode()) {
      const rows = localRows();
      const previous = rows.find((r) => r.user_id === u.id);
      if (previous && Date.parse(previous.created_at) > Date.now() - 5 * 60_000) return response;
      getDb().admin_password_recovery = rows.filter((r) => r.user_id !== u.id);
      localRows().push({ id: randomUUID(), user_id: u.id, temp_hash: hash, expires_at: expires, created_at: new Date().toISOString(), redeemed_at: null, grant_hash: null, claimed_at: null, completed_at: null }); saveDb();
    } else {
      const { data, error } = await sb.rpc('reserve_admin_recovery', { p_user_id: u.id, p_temp_hash: hash, p_expires_at: expires });
      if (error || !data) { if (error) console.warn('[recovery] Recovery database setup is unavailable.'); return response; }
    }
    const sent = await sendMail({ to: u.email, ...recoveryEmail({ name: u.full_name, password: temp, minutes: RECOVERY_MINUTES, siteUrl: siteUrl() }) });
    if (!sent.ok) {
      if (isTestMode()) { getDb().admin_password_recovery = localRows().filter((r) => r.temp_hash !== hash); saveDb(); }
      else await sb.from('admin_password_recovery').delete().eq('user_id', u.id).eq('temp_hash', hash);
    }
  } catch { console.warn('[recovery] A recovery request could not be completed.'); }
  return response;
}

/** A temporary password grants only a short-lived password-change permission, never an admin session. */
export async function redeemTemporaryPassword(email: string, password: string): Promise<boolean> {
  if (!/^MJ-[A-Za-z0-9_-]{24}$/.test(password)) return false;
  const u = await adminByEmail(email); if (!u) return false;
  const sb = createAdminClient(), hash = digest(password), now = new Date().toISOString();
  let row;
  if (isTestMode()) row = localRows().find((r) => r.user_id === u.id);
  else { const { data } = await sb.from('admin_password_recovery').select('*').eq('user_id', u.id).maybeSingle(); row = data; }
  if (!row || row.redeemed_at || Date.parse(row.expires_at) <= Date.now() || !equal(row.temp_hash, hash)) return false;
  const token = randomBytes(32).toString('base64url');
  if (isTestMode()) { row.redeemed_at = now; row.grant_hash = digest(token); saveDb(); }
  else {
    const { data, error } = await sb.from('admin_password_recovery').update({ redeemed_at: now, grant_hash: digest(token) }).eq('id', row.id).is('redeemed_at', null).gt('expires_at', now).select('id').maybeSingle();
    if (error || !data) return false;
  }
  await clearAdminIdle();
  if (isTestMode()) await clearLocalSession(); else await (await createSessionClient()).auth.signOut({ scope: 'local' });
  const grant: Grant = { id: row.id, token, exp: Date.parse(row.expires_at) };
  const payload = Buffer.from(JSON.stringify(grant)).toString('base64url');
  (await cookies()).set(COOKIE, `${payload}.${digest(payload)}`, { ...options, maxAge: Math.max(1, Math.floor((grant.exp - Date.now()) / 1000)) });
  return true;
}

export async function clearRecovery() { (await cookies()).set(COOKIE, '', { ...options, maxAge: 0 }); }
export async function readRecovery(): Promise<Grant | null> {
  const raw = (await cookies()).get(COOKIE)?.value; if (!raw) return null;
  const [payload, signature, extra] = raw.split('.');
  if (!payload || !signature || extra || !equal(digest(payload), signature)) return null;
  try { const g = JSON.parse(Buffer.from(payload, 'base64url').toString()); return typeof g.id === 'string' && typeof g.token === 'string' && g.exp > Date.now() ? g : null; } catch { return null; }
}

export async function setPermanentPassword(password: string) {
  if (password.length < 12 || password.length > 128) return { ok: false as const, error: 'Choose a password between 12 and 128 characters.' };
  const grant = await readRecovery();
  const expired = { ok: false as const, error: 'This temporary sign-in has expired or was already used. Request a new temporary password.' };
  if (!grant) return expired;
  const sb = createAdminClient(); let row;
  if (isTestMode()) row = localRows().find((r) => r.id === grant.id);
  else { const { data } = await sb.from('admin_password_recovery').select('*').eq('id', grant.id).maybeSingle(); row = data; }
  if (!row || !row.redeemed_at || row.claimed_at || row.completed_at || Date.parse(row.expires_at) <= Date.now() || !equal(row.grant_hash || '', digest(grant.token))) return expired;
  if (equal(row.temp_hash, digest(password))) return { ok: false as const, error: 'Choose a new permanent password that is different from the emailed temporary password.' };
  const { data: user } = await sb.from('app_users').select('id,email,full_name,is_active').eq('id', row.user_id).maybeSingle();
  if (!user?.is_active || !await adminByEmail(user.email)) return expired;
  const now = new Date().toISOString();
  // Invalidate second-factor shortcuts before making a password change.
  await forgetTrustedDevices(user.id);
  if (isTestMode()) { row.claimed_at = now; saveDb(); }
  else {
    const { data, error } = await sb.from('admin_password_recovery').update({ claimed_at: now }).eq('id', row.id).is('claimed_at', null).eq('grant_hash', digest(grant.token)).gt('expires_at', now).select('id').maybeSingle();
    if (error || !data) return expired;
  }
  if (isTestMode()) { const local = getDb().app_users.find((u) => u.id === user.id)!; local.password_hash = hashPassword(password); local.password_changed_at = now; local.password_change_required = false; row.completed_at = now; saveDb(); }
  else {
    const { error } = await sb.auth.admin.updateUserById(user.id, { password });
    if (error) {
      // Fail closed after an uncertain provider result; do not let a reset be replayed.
      await clearRecovery();
      return { ok: false as const, error: 'The password could not be updated. Request another temporary password and try again. Choose at least 12 characters.' };
    }
    const { error: policyError } = await sb.from('app_users').update({ password_change_required: false }).eq('id', user.id);
    if (policyError) { await clearRecovery(); return { ok: false as const, error: 'Account setup could not be completed. Request a new temporary password and try again.' }; }
    await sb.from('admin_password_recovery').update({ completed_at: now }).eq('id', row.id);
  }
  await clearRecovery();
  await audit(sb, { userId: user.id, email: user.email, name: user.full_name }, { action: 'security', entity: 'account', summary: 'Reset the admin password through email recovery.' });
  await sendMail({ to: user.email, ...passwordChangedEmail({ name: user.full_name, siteUrl: siteUrl() }) });
  return { ok: true as const, email: user.email };
}
