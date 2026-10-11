import { ADMIN_PATH } from '@/lib/admin-path';
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createAdminClient, createSessionClient } from './supabase/server';
import { isTestMode } from './mode';
import { findLocalUser, readLocalSession } from './local/auth';
import type { ModuleKey, Action } from './access';
import { readAdminIdle } from './admin-idle';
import { idleDeadline, validIdleToken } from './idle-token';
import { getSettings } from './settings';
import { localFactorId, validTrustedDevice } from './trusted-devices';

export type AdminSession = { userId: string; email: string; name: string; hasMfa: boolean; mfaRequired: boolean; roles: string[]; privileges: string[]; idleDeadline: number; sessionKey: string };

/** The privilege codes (products.add ...) and role names an active user holds through their active roles. */
async function loadAccess(userId: string) {
  const { data } = await createAdminClient()
    .from('user_roles')
    .select('is_active, roles(name, is_active, role_privileges(is_active, privileges(code, is_active)))')
    .eq('user_id', userId)
    .eq('is_active', true);
  const privileges = new Set<string>();
  const roles: string[] = [];
  for (const ur of (data ?? []) as any[]) {
    const role = ur.roles;
    if (!role?.is_active) continue;
    roles.push(role.name);
    for (const rp of role.role_privileges ?? []) if (rp.is_active && rp.privileges?.is_active) privileges.add(rp.privileges.code);
  }
  return { roles, privileges: [...privileges] };
}

/** Returns the signed-in admin (fully authenticated, incl. 2FA when enabled) with their privileges, or null. */
async function readAdmin(setupOnly = false): Promise<AdminSession | null> {
  let id: string, email: string, name: string, hasMfa: boolean, mfaRequired: boolean;
  if (isTestMode()) {
    const s = await readLocalSession();
    const u = s && findLocalUser(s.uid);
    if (!s || !u || !u.is_active || u.password_change_required) return null;
    mfaRequired = !!u.mfa_required;
    if (setupOnly ? (!mfaRequired || u.totp_enabled) : ((mfaRequired && !u.totp_enabled) || (u.totp_enabled && s.aal < 2 && !(u.totp_secret && await validTrustedDevice(u.id, localFactorId(u.totp_secret)))))) return null;
    ({ id, email, name, hasMfa } = { id: u.id, email: u.email, name: u.full_name || u.email, hasMfa: !!u.totp_enabled });
  } else {
    const sb = await createSessionClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data: row } = await createAdminClient().from('app_users').select('id, email, full_name, is_active, mfa_required, password_change_required').eq('id', user.id).maybeSingle();
    if (!row || !row.is_active || row.password_change_required) return null;
    mfaRequired = !!row.mfa_required;
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    hasMfa = aal?.nextLevel === 'aal2';
    if (!aal || (setupOnly && (!mfaRequired || hasMfa)) || (!setupOnly && mfaRequired && !hasMfa)) return null;
    if (!setupOnly && (mfaRequired || hasMfa) && aal.currentLevel !== 'aal2') {
      const { data: factors } = await sb.auth.mfa.listFactors();
      const factor = factors?.totp?.find((f) => f.status === 'verified');
      if (!factor || !await validTrustedDevice(user.id, factor.id)) return null;
    }
    ({ id, email, name } = { id: user.id, email: row.email, name: row.full_name || row.email });
  }
  const [idle, settings] = await Promise.all([readAdminIdle(), getSettings()]);
  if (!validIdleToken(idle, id, settings.admin_idle_timeout_minutes)) return null;
  const { roles, privileges } = await loadAccess(id);
  if (!roles.length) return null; // a user without any active role cannot use the portal
  return { userId: id, email, name, hasMfa, mfaRequired, roles, privileges: setupOnly ? [] : privileges, idleDeadline: idleDeadline(idle!, settings.admin_idle_timeout_minutes), sessionKey: idle!.sid };
}
export const getAdmin = cache(() => readAdmin());
/** Limited identity for mandatory enrollment. Never authorizes portal actions. */
export const getMfaSetupAdmin = cache(() => readAdmin(true));

/** For pages and layouts: send the visitor to the sign-in screen when they are not allowed in. */
export async function requireAdmin(): Promise<AdminSession> {
  const a = await getAdmin();
  if (!a) redirect(`${ADMIN_PATH}/login`);
  return a;
}

/** For pages: needs a specific privilege (normally module.view). Shows a friendly "no access" page otherwise. */
export async function requirePrivilege(module: ModuleKey, action: Action = 'view'): Promise<AdminSession> {
  const a = await requireAdmin();
  if (!a.privileges.includes(`${module}.${action}`)) redirect(`${ADMIN_PATH}/no-access`);
  return a;
}

/** For server actions: throws instead of redirecting. */
export async function assertAdmin(): Promise<AdminSession> {
  const a = await getAdmin();
  if (!a) throw new Error('Unauthorized');
  return a;
}
