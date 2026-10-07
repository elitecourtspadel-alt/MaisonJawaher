import 'server-only';
import QRCode from 'qrcode';
import { createAdminClient, createSessionClient } from './supabase/server';
import { isTestMode } from './mode';
import { getAdmin, getMfaSetupAdmin } from './admin-auth';
import { audit } from './admin/audit';
import { clearLocalSession, findLocalUser, findLocalUserByEmail, isLocalAdmin, readLocalSession, setLocalSession, verifyPassword } from './local/auth';
import { saveDb } from './local/db';
import { newTotpSecret, otpauthUri, verifyTotp } from './totp';
import { clearAdminIdle, startAdminIdle } from './admin-idle';
import { clearRecovery, redeemTemporaryPassword } from './password-recovery';
import { forgetTrustedDevices, localFactorId, rememberVerifiedDevice, TrustedDeviceLimit, validTrustedDevice, verifiedFactor } from './trusted-devices';

export type Step<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const BAD_LOGIN = 'Incorrect email or password';
import { activeLock, clearFailedLogins, lockMessage, recordFailedLogin } from './login-lockout';
const BAD_CODE = 'That code is not valid or has expired';

export async function passwordLogin(email: string, password: string): Promise<Step<{ mfa: boolean; reset?: boolean; setupMfa?: boolean }>> {
  email = email.trim().toLowerCase();
  try { if (await redeemTemporaryPassword(email, password)) return { ok: true, mfa: false, reset: true }; }
  catch { return { ok: false, error: 'Sign-in is temporarily unavailable. Please try again later.' }; }
  await clearRecovery();
  // A blocked account is refused before the password is even checked, so a correct guess during a block does not work.
  const blocked = await activeLock(email);
  if (blocked) return { ok: false, error: lockMessage(blocked) };
  const wrong = async (): Promise<{ ok: false; error: string }> => {
    const until = await recordFailedLogin(email);
    return { ok: false, error: until ? lockMessage(until) : BAD_LOGIN };
  };
  if (isTestMode()) {
    const u = findLocalUserByEmail(email);
    if (!u || !u.is_active || !u.password_hash || !isLocalAdmin(u.id) || !verifyPassword(password, u.password_hash)) return wrong();
    await clearFailedLogins(u.id);
    if (u.password_change_required) return { ok: false, error: 'Use your one-time temporary password to choose a permanent password first.' };
    const setupMfa = !!u.mfa_required && !u.totp_enabled;
    await setLocalSession(u.id, u.totp_enabled || setupMfa ? 1 : 2);
    await startAdminIdle(u.id);
    const trusted = !!u.totp_enabled && !!u.totp_secret && await validTrustedDevice(u.id, localFactorId(u.totp_secret), true);
    if ((!u.totp_enabled || trusted) && !setupMfa) await audit(createAdminClient(), { userId: u.id, name: u.full_name, email: u.email }, { action: 'signed_in', entity: 'account', summary: trusted ? 'Signed in using a trusted device.' : 'Signed in.' });
    return { ok: true, mfa: !!u.totp_enabled && !trusted, setupMfa };
  }
  const sb = await createSessionClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return wrong();
  const { data: { user } } = await sb.auth.getUser();
  const { data: row } = user ? await createAdminClient().from('app_users').select('id, email, full_name, is_active, mfa_required, password_change_required').eq('id', user.id).maybeSingle() : { data: null };
  if (!row || !row.is_active) { await sb.auth.signOut(); return { ok: false, error: BAD_LOGIN }; }
  if (row.password_change_required) { await sb.auth.signOut(); return { ok: false, error: 'Use your one-time temporary password to choose a permanent password first.' }; }
  await clearFailedLogins(row.id);
  await startAdminIdle(row.id);
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal) { await sb.auth.signOut(); return { ok: false, error: 'Could not check account security. Please sign in again.' }; }
  const setupMfa = !!row.mfa_required && aal.nextLevel !== 'aal2';
  let needsCode = aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2';
  if (needsCode) {
    const { data: factors } = await sb.auth.mfa.listFactors();
    const factor = factors?.totp?.find((f) => f.status === 'verified');
    if (factor && await validTrustedDevice(row.id, factor.id, true)) needsCode = false;
  }
  if (!needsCode && !setupMfa) await audit(createAdminClient(), { userId: row.id, name: row.full_name, email: row.email }, { action: 'signed_in', entity: 'account', summary: 'Signed in.' });
  return { ok: true, mfa: needsCode, setupMfa };
}

export async function mfaLogin(code: string, trust = false): Promise<Step<{ trustError?: string; trustLimit?: { name: string; max: number } }>> {
  if (isTestMode()) {
    const s = await readLocalSession();
    const u = s && findLocalUser(s.uid);
    if (!s || !u?.is_active || u.password_change_required || !u.totp_enabled || !u.totp_secret || !verifyTotp(u.totp_secret, code)) return { ok: false, error: BAD_CODE };
    await setLocalSession(u.id, 2);
    await startAdminIdle(u.id);
    if (!await getAdmin()) return { ok: false, error: 'Please sign in again.' };
    await audit(createAdminClient(), { userId: u.id, name: u.full_name, email: u.email }, { action: 'signed_in', entity: 'account', summary: 'Signed in with a two-factor code.' });
    return trustResult(u.id, trust);
  }
  const sb = await createSessionClient();
  const { data: f } = await sb.auth.mfa.listFactors();
  const factor = f?.totp?.[0];
  if (!factor) return { ok: false, error: BAD_CODE };
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.replace(/\s/g, '') });
  if (error) return { ok: false, error: BAD_CODE };
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in again.' };
  await startAdminIdle(user.id);
  const admin = await getAdmin();
  if (admin) await audit(createAdminClient(), admin, { action: 'signed_in', entity: 'account', summary: 'Signed in with a two-factor code.' });
  if (!admin) return { ok: false, error: 'Please sign in again.' };
  return trustResult(user.id, trust);
}

async function trustResult(userId: string, trust: boolean): Promise<Step<{ trustError?: string; trustLimit?: { name: string; max: number } }>> {
  if (trust) {
    try { await rememberVerifiedDevice(userId); }
    catch (error) { if (error instanceof TrustedDeviceLimit) return { ok: true, trustLimit: { name: error.deviceName, max: error.maxDevices } }; return { ok: true, trustError: error instanceof Error ? error.message : 'This device could not be remembered. You will need a code next time.' }; }
  }
  return { ok: true };
}

export async function signOut() {
  const admin = await getAdmin();
  if (admin) await audit(createAdminClient(), admin, { action: 'signed_out', entity: 'account', summary: 'Signed out.' });
  await clearAdminIdle();
  if (isTestMode()) return clearLocalSession();
  await (await createSessionClient()).auth.signOut();
}

export async function mfaState(): Promise<{ enabled: boolean; id: string | null }> {
  if (isTestMode()) {
    const s = await readLocalSession();
    const u = s && findLocalUser(s.uid);
    return { enabled: !!u?.totp_enabled, id: u?.totp_enabled ? 'local' : null };
  }
  const { data } = await (await createSessionClient()).auth.mfa.listFactors();
  const v = data?.totp?.find((f) => f.status === 'verified');
  return { enabled: !!v, id: v?.id ?? null };
}

export async function mfaBegin(): Promise<Step<{ id: string; qr: string; secret: string }>> {
  const admin = await getAdmin() || await getMfaSetupAdmin();
  if (!admin) return { ok: false, error: 'Please sign in again.' };
  if (admin.hasMfa && !await verifiedFactor(admin.userId)) return { ok: false, error: 'Verify a fresh authenticator code on this page before changing 2FA.' };
  if (isTestMode()) {
    const u = findLocalUser(admin.userId)!;
    const secret = newTotpSecret();
    u.totp_pending = secret;
    saveDb();
    return { ok: true, id: 'local', secret, qr: await QRCode.toDataURL(otpauthUri(u.email, secret), { margin: 1, width: 352 }) };
  }
  const sb = await createSessionClient();
  const { data: f } = await sb.auth.mfa.listFactors();
  for (const x of f?.all ?? []) if (x.factor_type === 'totp' && x.status === 'unverified') await sb.auth.mfa.unenroll({ factorId: x.id });
  const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Maison Jawaher ${Date.now()}` });
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not start setup' };
  return { ok: true, id: data.id, secret: data.totp.secret, qr: data.totp.qr_code };
}

export async function mfaConfirm(id: string, code: string, trust = false): Promise<Step<{ trustError?: string; trustLimit?: { name: string; max: number } }>> {
  const admin = await getAdmin() || await getMfaSetupAdmin();
  if (!admin) return { ok: false, error: 'Please sign in again.' };
  if (admin.hasMfa && !await verifiedFactor(admin.userId)) return { ok: false, error: 'Verify a fresh authenticator code before changing 2FA.' };
  if (isTestMode()) {
    const u = findLocalUser(admin.userId)!;
    if (!u.totp_pending || !verifyTotp(u.totp_pending, code)) return { ok: false, error: BAD_CODE };
    u.totp_secret = u.totp_pending; u.totp_pending = null; u.totp_enabled = true;
    saveDb();
    await setLocalSession(u.id, 2);
    await forgetTrustedDevices(u.id);
    return trustResult(u.id, trust);
  }
  const { error } = await (await createSessionClient()).auth.mfa.challengeAndVerify({ factorId: id, code: code.replace(/\s/g, '') });
  if (error) return { ok: false, error: BAD_CODE };
  await forgetTrustedDevices(admin.userId);
  return trustResult(admin.userId, trust);
}

export async function mfaDisable(id: string): Promise<Step> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: 'Please sign in again.' };
  if (admin.mfaRequired) return { ok: false, error: 'Two-factor authentication is mandatory for this account and cannot be turned off.' };
  if (!await verifiedFactor(admin.userId)) return { ok: false, error: 'Verify a fresh authenticator code on this page before changing 2FA.' };
  if (isTestMode()) {
    const u = findLocalUser(admin.userId)!;
    u.totp_secret = null; u.totp_pending = null; u.totp_enabled = false;
    saveDb();
    await forgetTrustedDevices(admin.userId);
    await audit(createAdminClient(), admin, { action: 'security', entity: 'account', summary: 'Turned off two-factor authentication.' });
    return { ok: true };
  }
  const { error } = await (await createSessionClient()).auth.mfa.unenroll({ factorId: id });
  if (error) return { ok: false, error: error.message };
  await forgetTrustedDevices(admin.userId);
  await audit(createAdminClient(), admin, { action: 'security', entity: 'account', summary: 'Turned off two-factor authentication.' });
  return { ok: true };
}
