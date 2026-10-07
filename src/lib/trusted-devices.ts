import { ADMIN_PATH } from '@/lib/admin-path';
import 'server-only';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { createAdminClient, createSessionClient } from './supabase/server';
import { getSettings } from './settings';
import { isTestMode } from './mode';
import { findLocalUser, readLocalSession } from './local/auth';
import { getDb, saveDb } from './local/db';
import type { SiteSettings } from './types';

const COOKIE = 'mj_trusted_device';
const DAY = 86400000;
const options = () => ({ httpOnly: true, sameSite: 'lax' as const, path: `${ADMIN_PATH}`, secure: process.env.NODE_ENV === 'production' && !isTestMode() });
const hash = (value: string) => {
  const key = process.env.APP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || (isTestMode() ? 'local-recovery-test-secret' : '');
  if (!key) throw new Error('Trusted devices are not configured.');
  return createHmac('sha256', key).update(`trusted-device:${value}`).digest('hex');
};
const stamp = (u: any) => hash(`${u.id}:${u.updated_at ? Date.parse(u.updated_at) : ''}:${isTestMode() ? u.password_hash : ''}`);
export const localFactorId = (secret: string) => `local:${hash(secret)}`;
export class TrustedDeviceLimit extends Error {
  constructor(public deviceName: string, public maxDevices: number) { super('Confirm replacing the least recently used trusted device.'); }
}
async function userById(id: string) {
  if (isTestMode()) return findLocalUser(id);
  const { data, error } = await createAdminClient().from('app_users').select('id,is_active,password_change_required,updated_at').eq('id', id).maybeSingle();
  return error ? null : data;
}
type Device = { id: string; user_id: string; token_hash: string; factor_id: string; security_stamp: string; device_name: string; created_at: string; last_used_at: string; expires_at: string };
async function activeRows(id: string, factorId: string) {
  const settings = await getSettings(), user = await userById(id);
  if (!settings.admin_trusted_devices_enabled || !user?.is_active || user.password_change_required) return [];
  let rows: Device[];
  if (isTestMode()) rows = (getDb().admin_trusted_devices ??= []).filter((r) => r.user_id === id) as Device[];
  else {
    const { data, error } = await createAdminClient().from('admin_trusted_devices').select('*').eq('user_id', id);
    if (error) return [];
    rows = data || [];
  }
  return rows.filter((r) => r.factor_id === factorId && r.security_stamp === stamp(user) && Date.parse(r.expires_at) > Date.now() && Date.parse(r.created_at) + settings.admin_trusted_device_days * DAY > Date.now())
    .sort((a, b) => b.last_used_at.localeCompare(a.last_used_at) || b.id.localeCompare(a.id)).slice(0, settings.admin_max_trusted_devices);
}
/** Password/session authentication is still required separately. A cookie alone never grants access. */
export async function validTrustedDevice(id: string, factorId: string, touch = false): Promise<boolean> {
  try {
    const raw = (await cookies()).get(COOKIE)?.value;
    if (!raw || !/^[\da-f-]{36}\.[A-Za-z0-9_-]{43}$/.test(raw)) return false;
    const [deviceId, token] = raw.split('.');
    const row = (await activeRows(id, factorId)).find((r) => r.id === deviceId);
    const expected = hash(token);
    if (!row || row.token_hash.length !== expected.length || !timingSafeEqual(Buffer.from(row.token_hash), Buffer.from(expected))) return false;
    if (touch) {
      if (isTestMode()) { row.last_used_at = new Date().toISOString(); saveDb(); }
      else await createAdminClient().from('admin_trusted_devices').update({ last_used_at: new Date().toISOString() }).eq('id', row.id).eq('user_id', id);
    }
    return true;
  } catch { return false; }
}
export async function verifiedFactor(id: string): Promise<string | null> {
  if (isTestMode()) { const session = await readLocalSession(), user = findLocalUser(id); return session?.uid === id && session.aal === 2 && user?.totp_enabled && user.totp_secret ? localFactorId(user.totp_secret) : null; }
  const sb = await createSessionClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (user?.id !== id || aal?.currentLevel !== 'aal2') return null;
  const { data } = await sb.auth.mfa.listFactors();
  return data?.totp?.find((f) => f.status === 'verified')?.id || null;
}
export async function rememberVerifiedDevice(id: string, replaceOldest = false) {
  const factorId = await verifiedFactor(id), user = await userById(id), settings = await getSettings();
  if (!factorId || !user?.is_active || user.password_change_required) throw new Error('Verify a two-factor code before trusting a device.');
  if (!settings.admin_trusted_devices_enabled) throw new Error('Trusted devices are disabled in Settings.');
  const token = randomBytes(32).toString('base64url'), now = new Date().toISOString();
  const ua = (await headers()).get('user-agent') || '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const system = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'device';
  const old = await validTrustedDevice(id, factorId) ? (await cookies()).get(COOKIE)?.value?.split('.')[0] : undefined;
  const row: Device = { id: randomUUID(), user_id: id, token_hash: hash(token), factor_id: factorId, security_stamp: stamp(user), device_name: `${browser} on ${system}`, created_at: now, last_used_at: now, expires_at: new Date(Date.now() + settings.admin_trusted_device_days * DAY).toISOString() };
  if (isTestMode()) {
    const active = await activeRows(id, factorId);
    const others = active.filter((r) => r.id !== old);
    if (others.length >= settings.admin_max_trusted_devices && !replaceOldest) throw new TrustedDeviceLimit(others.at(-1)!.device_name, settings.admin_max_trusted_devices);
    getDb().admin_trusted_devices = (getDb().admin_trusted_devices || []).filter((r) => r.user_id !== id);
    getDb().admin_trusted_devices.push(row, ...others.slice(0, settings.admin_max_trusted_devices - 1)); saveDb();
  } else {
    const { data, error } = await createAdminClient().rpc('register_admin_trusted_device', { p_user_id: id, p_token_hash: row.token_hash, p_factor_id: factorId, p_security_stamp: row.security_stamp, p_device_name: row.device_name, p_expires_at: row.expires_at, p_max_devices: settings.admin_max_trusted_devices, p_replace_id: old && /^[\da-f-]{36}$/.test(old) ? old : null, p_replace_oldest: replaceOldest });
    if (error || !data) throw new Error('Could not save this device. Ask the site owner to apply the latest database migration.');
    if (data.limit) throw new TrustedDeviceLimit(data.name, data.max);
    row.id = data.id;
  }
  (await cookies()).set(COOKIE, `${row.id}.${token}`, { ...options(), maxAge: settings.admin_trusted_device_days * 86400 });
}
export async function forgetTrustedDevices(id: string, deviceId?: string) {
  if (isTestMode()) { getDb().admin_trusted_devices = (getDb().admin_trusted_devices || []).filter((r) => r.user_id !== id || (deviceId && r.id !== deviceId)); saveDb(); }
  else {
    let query = createAdminClient().from('admin_trusted_devices').delete().eq('user_id', id);
    if (deviceId) query = query.eq('id', deviceId);
    const { error } = await query;
    if (error) throw new Error('Could not remove the trusted device. Please try again.');
  }
  if (!deviceId || (await cookies()).get(COOKIE)?.value?.startsWith(`${deviceId}.`)) (await cookies()).set(COOKIE, '', { ...options(), maxAge: 0 });
}
export async function listTrustedDevices(id: string, factorId: string) {
  const settings = await getSettings(), current = (await cookies()).get(COOKIE)?.value?.split('.')[0];
  return (await activeRows(id, factorId)).map((r) => ({ id: r.id, name: r.device_name, current: r.id === current, lastUsed: r.last_used_at, expiresAt: new Date(Math.min(Date.parse(r.expires_at), Date.parse(r.created_at) + settings.admin_trusted_device_days * DAY)).toISOString() }));
}

/** Reductions permanently remove affected grants; re-enabling cannot revive revoked trust. */
export async function applyTrustedDevicePolicy(settings: SiteSettings) {
  if (isTestMode()) {
    const count = new Map<string, number>();
    getDb().admin_trusted_devices = (getDb().admin_trusted_devices || []).filter((r) => settings.admin_trusted_devices_enabled && Date.parse(r.expires_at) > Date.now() && Date.parse(r.created_at) + settings.admin_trusted_device_days * DAY > Date.now())
      .sort((a, b) => b.last_used_at.localeCompare(a.last_used_at) || b.id.localeCompare(a.id))
      .filter((r) => { const n = (count.get(r.user_id) || 0) + 1; count.set(r.user_id, n); return n <= settings.admin_max_trusted_devices; });
    saveDb();
  } else {
    const { error } = await createAdminClient().rpc('prune_admin_trusted_devices', { p_enabled: settings.admin_trusted_devices_enabled, p_days: settings.admin_trusted_device_days, p_max_devices: settings.admin_max_trusted_devices });
    if (error) throw new Error('Could not update the trusted-device policy. Apply the latest database migration and try again.');
  }
}
