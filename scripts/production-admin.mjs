import { randomBytes, randomUUID, createHmac, scryptSync } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { adminInvitation } from '../src/lib/email/admin-invitation.mjs';
import { normalizeAdminPath } from '../src/lib/admin-path.mjs';

export const PRODUCTION_ADMIN_ROLES = ['super_admin', 'store_manager', 'content_editor', 'order_handler', 'viewer'];

/** Called after environment confirmation. The temporary password is never an Auth password. */
export async function provisionProductionAdmin({ email, name, role = 'super_admin', reissue = false, env = process.env, client, output = console.log }) {
  email = email.trim().toLowerCase(); name = name?.trim() || email.split('@')[0];
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid admin email address.');
  if (!PRODUCTION_ADMIN_ROLES.includes(role)) throw new Error('Choose a valid admin role.');
  const mode = (env.APP_MODE || '').toLowerCase();
  const local = mode === 'test' || mode === 'local' || (mode !== 'supabase' && !env.NEXT_PUBLIC_SUPABASE_URL);
  const key = env.APP_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || (local ? 'local-recovery-test-secret' : '');
  if (!key) throw new Error('Configure APP_SECRET or SUPABASE_SERVICE_ROLE_KEY before creating a secure admin.');
  const temporary = `MJ-${randomBytes(18).toString('base64url')}`;
  const inaccessiblePassword = randomBytes(48).toString('base64url');
  const now = new Date().toISOString(), expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  const recovery = (id) => ({ id: randomUUID(), user_id: id, temp_hash: createHmac('sha256', key).update(`recovery:${temporary}`).digest('hex'), expires_at: expiresAt, created_at: now, redeemed_at: null, grant_hash: null, claimed_at: null, completed_at: null });
  const policy = { email, full_name: name, is_active: true, mfa_required: true, password_change_required: true, updated_at: now };
  let userId;
  if (local) {
    const directory = path.resolve(env.LOCAL_DATA_DIR || '.data'), file = path.join(directory, 'db.json');
    const db = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { __needsSeed: true };
    db.app_users ??= []; db.user_roles ??= [];
    let user = db.app_users.find((u) => u.email === email);
    if (user && !reissue) throw new Error('This admin already exists. To replace the password and role, rerun with --reissue. Existing verified 2FA will be kept.');
    const salt = randomBytes(16);
    const password_hash = `scrypt$${salt.toString('base64')}$${scryptSync(inaccessiblePassword, salt, 64).toString('base64')}`;
    if (!user) { user = { id: randomUUID(), created_at: now, totp_enabled: false }; db.app_users.push(user); }
    Object.assign(user, policy, { password_hash, password_changed_at: now });
    userId = user.id;
    db.user_roles = db.user_roles.filter((r) => r.user_id !== userId);
    db.user_roles.push({ id: randomUUID(), user_id: userId, role_id: `00000000-0000-4000-8000-${String(PRODUCTION_ADMIN_ROLES.indexOf(role) + 1).padStart(12, '0')}`, is_active: true, created_at: now });
    db.admin_password_recovery = (db.admin_password_recovery || []).filter((r) => r.user_id !== userId);
    db.admin_password_recovery.push(recovery(userId));
    db.admin_trusted_devices = (db.admin_trusted_devices || []).filter((r) => r.user_id !== userId);
    mkdirSync(directory, { recursive: true }); writeFileSync(file, JSON.stringify(db));
  } else {
    if (!client) throw new Error('Supabase is not configured.');
    // Check schema before creating an Auth account, and reject unexpected read errors.
    const existing = await client.from('app_users').select('id,mfa_required,password_change_required').eq('email', email).maybeSingle();
    const roles = await client.from('roles').select('id').eq('code', role).eq('is_active', true).maybeSingle();
    const ready = await client.from('admin_password_recovery').select('id').limit(1);
    const devicesReady = await client.from('admin_trusted_devices').select('id').limit(1);
    if (existing.error || roles.error || !roles.data || ready.error || devicesReady.error) throw new Error('Database setup is incomplete. Apply the regular database migration and role seeds before creating this admin.');
    if (existing.data && !reissue) throw new Error('This admin already exists. Rerun with --reissue only if you intend to replace the password and role. Existing verified 2FA will be kept.');
    if (existing.data) {
      userId = existing.data.id;
      const locked = await client.from('app_users').update(policy).eq('id', userId);
      if (locked.error) throw new Error('Could not enforce account security. No password was changed.');
      const updated = await client.auth.admin.updateUserById(userId, { password: inaccessiblePassword, email_confirm: true });
      if (updated.error) throw new Error('Could not reissue the admin invitation. The account remains locked pending setup.');
    } else {
      const created = await client.auth.admin.createUser({ email, password: inaccessiblePassword, email_confirm: true });
      if (created.error || !created.data.user) throw new Error('Could not create the Auth account. If this email already exists in Supabase Auth, link it with the regular admin tool first, then use --reissue.');
      userId = created.data.user.id;
      const saved = await client.from('app_users').insert({ id: userId, ...policy });
      if (saved.error) throw new Error('Could not save the admin policy. No portal access was granted. Check the database setup.');
    }
    const removed = await client.from('user_roles').delete().eq('user_id', userId);
    if (removed.error) throw new Error('Could not replace admin roles. Account remains locked pending setup.');
    const assigned = await client.from('user_roles').insert({ user_id: userId, role_id: roles.data.id });
    if (assigned.error) throw new Error('Could not assign the admin role. Account remains locked pending setup.');
    const revoked = await client.from('admin_trusted_devices').delete().eq('user_id', userId);
    if (revoked.error) throw new Error('Could not revoke old trusted devices. Apply the latest migration, then rerun with --reissue.');
    const reserved = await client.from('admin_password_recovery').upsert(recovery(userId), { onConflict: 'user_id' });
    if (reserved.error) throw new Error('Could not issue a temporary password. Rerun with --reissue after resolving database access.');
  }
  const from = (env.MAIL_FROM_EMAIL || env.SMTP_USER || '').trim();
  const host = env.SMTP_HOST?.trim();
  if (host && !from) throw new Error('SMTP_HOST is set but the sender is missing. Configure MAIL_FROM_EMAIL or SMTP_USER, then rerun with --reissue. No password was displayed.');
  if (host) {
    const port = Number(env.SMTP_PORT) || 587;
    const transport = nodemailer.createTransport({ host, port, secure: env.SMTP_SECURE ? /^(1|true|yes)$/i.test(env.SMTP_SECURE) : port === 465, auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS || '' } : undefined, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
    try { await transport.sendMail({ from: { name: env.MAIL_FROM_NAME || 'Maison Jawaher', address: from }, to: email, ...adminInvitation({ name, password: temporary, expiresAt, siteUrl: env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001', adminPath: normalizeAdminPath(env.NEXT_PUBLIC_ADMIN_PATH) }) }); }
    catch { throw new Error('Admin created, but SMTP could not deliver the invitation. No password was displayed. Fix SMTP and rerun with --reissue to generate a fresh invitation.'); }
    finally { transport.close?.(); }
    output(`  Invitation emailed to ${email}. The password is not printed because SMTP is configured.`);
  } else {
    output(`\n  SMTP is not configured. Deliver this password privately to ${email}.\n  ONE-TIME TEMPORARY PASSWORD: ${temporary}\n  Expires: ${new Date(expiresAt).toUTCString()} (15 minutes).\n  Do not share or retain this terminal output.\n`);
  }
  output('  Next: sign in, choose a permanent password, then verify 2FA before entering the portal.');
  return { userId, expiresAt };
}
