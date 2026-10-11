import 'server-only';
import nodemailer from 'nodemailer';
import { createAdminClient } from './supabase/server';
import { defaultEmailSettings } from './settings-defaults';
import type { EmailSettings } from './types';

/**
 * The mail server is configured in the environment (.env.local / hosting settings), never in the portal:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE (true for port 465), SMTP_USER, SMTP_PASS, MAIL_FROM_EMAIL, MAIL_FROM_NAME
 * The portal only decides whether the site sends email (see getEmailSettings).
 */
export type MailConfig = { host: string; port: number; secure: boolean; user: string; pass: string; fromName: string; fromEmail: string };

export function getMailConfig(): MailConfig | null {
  const e = process.env;
  if (!e.SMTP_HOST?.trim()) return null;
  const port = Number(e.SMTP_PORT) || 587;
  const secure = e.SMTP_SECURE ? /^(1|true|yes)$/i.test(e.SMTP_SECURE) : port === 465;
  const user = e.SMTP_USER?.trim() ?? '';
  const fromEmail = (e.MAIL_FROM_EMAIL || user).trim();
  if (!fromEmail) return null;
  return { host: e.SMTP_HOST.trim(), port, secure, user, pass: e.SMTP_PASS ?? '', fromName: e.MAIL_FROM_NAME?.trim() || 'Maison Jawaher', fromEmail };
}

export const isMailConfigured = () => !!getMailConfig();

/** Email switches saved from the portal (private: the browser never receives them). */
export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const { data } = await createAdminClient().from('private_settings').select('email').eq('id', 1).maybeSingle();
    return { ...defaultEmailSettings, ...((data?.email as Partial<EmailSettings> | undefined) ?? {}) };
  } catch {
    return defaultEmailSettings;
  }
}

export function buildTransport(c: MailConfig) {
  return nodemailer.createTransport({
    host: c.host, port: c.port, secure: c.secure,
    auth: c.user ? { user: c.user, pass: c.pass } : undefined,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
}

export const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Sends one email through the configured server. Never throws; says why it did not send. Does not look at the portal switches. */
export async function sendMail(opts: { to: string; subject: string; html: string; text?: string; replyTo?: string }) {
  const cfg = getMailConfig();
  if (!cfg) return { ok: false as const, error: 'The mail server is not configured. Set SMTP_HOST and the other SMTP_* values in the environment.' };
  try {
    await buildTransport(cfg).sendMail({
      from: `"${cfg.fromName.replace(/"/g, '')}" <${cfg.fromEmail}>`,
      to: opts.to, subject: opts.subject, html: opts.html, text: opts.text, replyTo: opts.replyTo,
    });
    return { ok: true as const };
  } catch (e) {
    console.warn('[mail] The configured mail server could not send a message.');
    return { ok: false as const, error: e instanceof Error ? e.message : 'Send failed' };
  }
}
