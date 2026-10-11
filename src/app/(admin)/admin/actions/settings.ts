'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { audit } from '@/lib/admin/audit';
import { guard } from '@/lib/admin/guard';
import { fail, type Result } from '@/lib/admin/result';
import { brandOf } from '@/lib/email/notify';
import { testEmail } from '@/lib/email/templates';
import { getEmailSettings, getMailConfig, sendMail } from '@/lib/mail';
import { isLocale } from '@/lib/i18n';
import { getSettings } from '@/lib/settings';
import { mergeSettings } from '@/lib/settings-defaults';
import type { AuditChange, EmailSettings, SiteSettings } from '@/lib/types';
import { imageUrl } from '@/lib/admin/result';
import { removeUnusedMedia } from '@/lib/admin/media-cleanup';
import { applyTrustedDevicePolicy } from '@/lib/trusted-devices';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use the format 09:30').or(z.literal(''));
const https = (what: string) => z.string().trim().max(500).refine((v) => !v || /^https:\/\//.test(v), `${what} must start with https://`);
const email = (what: string) => z.string().trim().max(200).refine((v) => !v || /^\S+@\S+\.\S+$/.test(v), `${what} is not a valid email address`);
const textMap = z.record(z.string(), z.string().trim().max(300));

const settingsSchema = z.object({
  admin_trusted_devices_enabled: z.boolean(),
  admin_trusted_device_days: z.coerce.number().int().min(1).max(90),
  admin_max_trusted_devices: z.coerce.number().int().min(1).max(10),
  admin_max_failed_logins: z.coerce.number().int().min(1, 'Allow at least 1 attempt').max(20, 'Use no more than 20 attempts'),
  admin_lockout_minutes: z.coerce.number().int().min(1, 'Use at least 1 minute').max(1440, 'Use no more than 1440 minutes (24 hours)'),
  hero_background_url: imageUrl('Choose a valid hero background photo.').or(z.literal('')),
  hero_background_path: z.string().max(500).refine((p) => !p || /^(settings|slides|products|categories)\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/.test(p), 'The background photo path is not valid.'),
  admin_idle_timeout_minutes: z.coerce.number().int().min(5, 'Use at least 5 minutes').max(240, 'Use no more than 240 minutes'),
  show_prices: z.boolean(), currency: z.string().trim().min(1, 'Enter a currency code').max(8), enable_orders: z.boolean(),
  phone: z.string().trim().max(30), whatsapp_number: z.string().trim().max(20).regex(/^\d*$/, 'Use digits only, with the country code (for example 212600000000)'),
  whatsapp_community_url: https('The community link').refine((v) => !v || /^https:\/\/(chat\.whatsapp\.com\/[\w-]+|(www\.)?whatsapp\.com\/channel\/[\w-]+)\/?(\?.*)?$/.test(v), 'Use the invite link from WhatsApp, for example https://chat.whatsapp.com/…'), show_community_button: z.boolean(), show_location: z.boolean(),
  email: email('The email'),
  address: textMap, map_url: https('The map link'),
  hours: z.array(z.object({ open: hhmm, close: hhmm, closed: z.boolean() })).length(7),
  socials: z.array(z.object({ platform: z.string().max(20), url: https('The link'), enabled: z.boolean() })).max(12),
  site_title: textMap, site_description: textMap, community_title: textMap, community_message: textMap,
});

const LABELS: Record<keyof SiteSettings, string> = {
  hero_background_url: 'Home hero background photo', hero_background_path: 'Home hero photo file',
  admin_idle_timeout_minutes: 'Admin idle timeout (minutes)',
  admin_trusted_devices_enabled: 'Allow trusted devices',
  admin_trusted_device_days: 'Trusted device period (days)',
  admin_max_trusted_devices: 'Maximum trusted devices per admin',
  admin_max_failed_logins: 'Wrong passwords allowed before blocking',
  admin_lockout_minutes: 'Block duration (minutes)',
  show_prices: 'Show prices', currency: 'Currency', enable_orders: 'Accept orders', phone: 'Phone number', whatsapp_number: 'WhatsApp number',
  whatsapp_community_url: 'WhatsApp community link', show_community_button: 'Show the community button', show_location: 'Show the shop location',
  email: 'Public email', address: 'Address', map_url: 'Map link', hours: 'Opening hours',
  socials: 'Social media links', site_title: 'Site title', site_description: 'Site description',
  community_title: 'Community invitation heading', community_message: 'Community invitation message',
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const plain = (v: unknown) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v === '' || v == null ? 'empty' : String(v));

/** Merges the changed sections into the stored settings and records what changed. */
export async function saveSettings(patch: Partial<SiteSettings>): Promise<Result> {
  try {
    const { admin, sb } = await guard('settings', 'update');
    const { data: cur } = await sb.from('site_settings').select('data').eq('id', 1).maybeSingle();
    const before = mergeSettings(cur?.data as Partial<SiteSettings>);
    const next = settingsSchema.parse({ ...mergeSettings({ ...before, ...patch }), admin_idle_timeout_minutes: patch.admin_idle_timeout_minutes ?? before.admin_idle_timeout_minutes,
      admin_trusted_devices_enabled: patch.admin_trusted_devices_enabled ?? before.admin_trusted_devices_enabled ?? true,
      admin_trusted_device_days: patch.admin_trusted_device_days ?? before.admin_trusted_device_days ?? 30,
      admin_max_trusted_devices: patch.admin_max_trusted_devices ?? before.admin_max_trusted_devices ?? 2 });
    if (['admin_trusted_devices_enabled', 'admin_trusted_device_days', 'admin_max_trusted_devices'].some((key) => (patch as any)[key] !== undefined && (before as any)[key] !== (next as any)[key])) await applyTrustedDevicePolicy(next);
    const { error } = await sb.from('site_settings').upsert({ id: 1, data: next, updated_by: admin.userId });
    if (error) return { ok: false, error: error.message };

    const changes: AuditChange[] = [];
    for (const key of Object.keys(patch) as (keyof SiteSettings)[]) {
      if (same(before[key], next[key])) continue;
      const simple = typeof next[key] !== 'object';
      if (key === 'address' || key === 'site_title' || key === 'site_description' || key === 'community_title' || key === 'community_message') {
        const a = before[key] as Record<string, string>, b = next[key] as Record<string, string>;
        for (const l of new Set([...Object.keys(a), ...Object.keys(b)])) if ((a[l] ?? '') !== (b[l] ?? '')) changes.push({ label: `${LABELS[key]} (${l.toUpperCase()})`, from: plain(a[l]), to: plain(b[l]) });
      } else changes.push({ label: LABELS[key], from: simple ? plain(before[key]) : undefined, to: simple ? plain(next[key]) : 'updated' });
    }
    if (changes.length) {
      const names = changes.map((c) => c.label.toLowerCase());
      await audit(sb, admin, {
        action: 'changed', entity: 'setting', label: 'Site settings', changes,
        summary: changes.length === 1 && changes[0].from !== undefined
          ? `Changed the setting “${changes[0].label}” from “${changes[0].from}” to “${changes[0].to}”.`
          : `Changed the site settings: ${names.slice(0, 4).join(', ')}${names.length > 4 ? ` and ${names.length - 4} more` : ''}.`,
      });
    }
    revalidatePath('/', 'layout');
    const warning = before.hero_background_path && before.hero_background_path !== next.hero_background_path ? await removeUnusedMedia(sb, [before.hero_background_path]) : undefined;
    return { ok: true, warning };
  } catch (e) { return fail(e); }
}

const emailSchema = z.object({
  enabled: z.boolean(), notify_admin: z.boolean(), notify_customer: z.boolean(),
  admin_email: email('The admin email'), admin_locale: z.string().refine(isLocale, 'Choose English or French'),
});

const EMAIL_LABELS: Record<keyof EmailSettings, string> = {
  enabled: 'Send emails', notify_admin: 'Email me about new orders and messages', notify_customer: 'Email customers an order confirmation',
  admin_email: 'Admin email address', admin_locale: 'Language of admin emails',
};

/** Saves the email switches (private settings). The mail server itself comes from the environment. */
export async function saveEmailSettings(input: unknown): Promise<Result> {
  try {
    const { admin, sb } = await guard('settings', 'update');
    const next = emailSchema.parse(input);
    const before = await getEmailSettings();
    const { error } = await sb.from('private_settings').upsert({ id: 1, email: next, updated_by: admin.userId });
    if (error) return { ok: false, error: error.message };
    const changes: AuditChange[] = (Object.keys(EMAIL_LABELS) as (keyof EmailSettings)[])
      .filter((k) => before[k] !== next[k])
      .map((k) => ({ label: EMAIL_LABELS[k], from: plain(before[k]), to: plain(next[k]) }));
    if (changes.length) {
      await audit(sb, admin, {
        action: 'changed', entity: 'setting', label: 'Email settings', changes,
        summary: changes.length === 1 ? `Changed the setting “${changes[0].label}” from “${changes[0].from}” to “${changes[0].to}”.` : `Changed the email settings: ${changes.map((c) => c.label.toLowerCase()).join(', ')}.`,
      });
    }
    return { ok: true };
  } catch (e) { return fail(e); }
}

/** Sends a test email through the server configured in the environment (ignores the on/off switches on purpose). */
export async function sendTestEmail(to: string, lang: string): Promise<Result> {
  try {
    await guard('settings', 'update');
    z.string().email('Enter a valid email address to send the test to').parse(to);
    if (!getMailConfig()) return { ok: false, error: 'The mail server is not configured yet. Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM_EMAIL in the environment, then restart the site.' };
    const m = testEmail(isLocale(lang) ? lang : 'en', brandOf(await getSettings()));
    const r = await sendMail({ to, ...m });
    return r.ok ? { ok: true } : { ok: false, error: r.error };
  } catch (e) { return fail(e); }
}
