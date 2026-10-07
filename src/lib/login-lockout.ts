import 'server-only';
import { createAdminClient } from './supabase/server';
import { getSettings } from './settings';
import { isTestMode } from './mode';
import { findLocalUserByEmail } from './local/auth';
import { getDb, saveDb } from './local/db';
import { audit } from './admin/audit';

/**
 * Wrong-password lockout, counted per admin account (the per-visitor rate limit in spam.ts still applies on top).
 * The limit and the block duration come from Admin > Settings > Security. Unknown emails are ignored, so an
 * attacker cannot create lockouts for accounts that do not exist.
 */
type Attempt = { user_id: string; failed_count: number; last_failed_at: string | null; locked_until: string | null };
type Account = { id: string; email: string; full_name: string };

async function findAccount(email: string): Promise<Account | null> {
  email = email.trim().toLowerCase();
  if (isTestMode()) { const u = findLocalUserByEmail(email); return u?.is_active ? { id: u.id, email: u.email, full_name: u.full_name } : null; }
  const { data } = await createAdminClient().from('app_users').select('id,email,full_name').eq('email', email).eq('is_active', true).maybeSingle();
  return data ?? null;
}

const localAttempts = () => ((getDb().admin_login_attempts ??= []) as Attempt[]);

export const lockMessage = (until: Date) => {
  const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
  return `Too many wrong passwords. This account is blocked for about ${minutes} more ${minutes === 1 ? 'minute' : 'minutes'}.`;
};

/** When this email's account is blocked until, or null. Call before checking the password. */
export async function activeLock(email: string): Promise<Date | null> {
  const account = await findAccount(email);
  if (!account) return null;
  let until: string | null | undefined;
  if (isTestMode()) until = localAttempts().find((r) => r.user_id === account.id)?.locked_until;
  else until = (await createAdminClient().from('admin_login_attempts').select('locked_until').eq('user_id', account.id).maybeSingle()).data?.locked_until;
  return until && Date.parse(until) > Date.now() ? new Date(until) : null;
}

/** Counts one wrong password. Returns the lock end time when this attempt (or an earlier one) blocked the account. */
export async function recordFailedLogin(email: string): Promise<Date | null> {
  const account = await findAccount(email);
  if (!account) return null;
  const { admin_max_failed_logins: max, admin_lockout_minutes: minutes } = await getSettings();
  let until: string | null = null;
  let newlyLocked = false;
  if (isTestMode()) {
    const rows = localAttempts();
    let row = rows.find((r) => r.user_id === account.id);
    if (!row) rows.push(row = { user_id: account.id, failed_count: 0, last_failed_at: null, locked_until: null });
    if (row.locked_until && Date.parse(row.locked_until) > Date.now()) return new Date(row.locked_until);
    const fresh = row.last_failed_at && Date.parse(row.last_failed_at) > Date.now() - minutes * 60_000;
    const count = (fresh ? row.failed_count : 0) + 1;
    if (count >= max) { Object.assign(row, { failed_count: 0, last_failed_at: null, locked_until: new Date(Date.now() + minutes * 60_000).toISOString() }); newlyLocked = true; }
    else Object.assign(row, { failed_count: count, last_failed_at: new Date().toISOString(), locked_until: null });
    saveDb();
    until = row.locked_until;
  } else {
    const { data, error } = await createAdminClient().rpc('record_failed_admin_login', { p_user_id: account.id, p_max: max, p_minutes: minutes });
    if (error) throw new Error('Could not record the failed sign-in.');
    until = data;
    newlyLocked = !!until && Date.parse(until) - Date.now() > (minutes * 60_000) - 5_000;
  }
  if (newlyLocked) await audit(createAdminClient(), { userId: account.id, name: account.full_name, email: account.email }, { action: 'security', entity: 'account', summary: `Account blocked for ${minutes} minutes after ${max} wrong passwords.` }).catch(() => {});
  return until ? new Date(until) : null;
}

/** A correct password: forget earlier mistakes. */
export async function clearFailedLogins(userId: string) {
  if (isTestMode()) {
    const rows = localAttempts();
    const i = rows.findIndex((r) => r.user_id === userId);
    if (i >= 0) { rows.splice(i, 1); saveDb(); }
  } else await createAdminClient().from('admin_login_attempts').delete().eq('user_id', userId);
}
