import 'server-only';
import { isLocale } from '../i18n';
import { getEmailSettings, isMailConfigured, sendMail } from '../mail';
import type { SiteSettings } from '../types';
import { adminContactEmail, adminOrderEmail, customerOrderEmail, type MailBrand, type OrderMail } from './templates';

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(/\/$/, '');

export const brandOf = (s: SiteSettings): MailBrand => ({ siteUrl: siteUrl(), currency: s.currency, phone: s.phone, email: s.email, whatsapp: s.whatsapp_number });

/**
 * Sends the emails for a new order: one to the shop, one to the customer. Each respects the portal switches
 * (all email / admin alerts / customer confirmations). A failure is logged and never blocks the order.
 */
export async function notifyNewOrder(order: OrderMail, settings: SiteSettings) {
  try {
    const cfg = await getEmailSettings();
    if (!cfg.enabled || !isMailConfigured()) return;
    const brand = brandOf(settings);
    const jobs: Promise<unknown>[] = [];

    const to = cfg.admin_email || settings.email;
    if (cfg.notify_admin && to) {
      const lang = isLocale(cfg.admin_locale) ? cfg.admin_locale : 'en';
      jobs.push(sendMail({ to, replyTo: order.email || undefined, ...adminOrderEmail(order, brand, lang) }));
    }
    if (cfg.notify_customer && order.email) {
      jobs.push(sendMail({ to: order.email, replyTo: settings.email || undefined, ...customerOrderEmail(order, brand) }));
    }
    await Promise.all(jobs);
  } catch (e) { console.error('[mail] order notification failed', e); }
}

export async function notifyNewMessage(msg: { name: string; email: string; phone: string; subject: string; body: string }, settings: SiteSettings) {
  try {
    const cfg = await getEmailSettings();
    const to = cfg.admin_email || settings.email;
    if (!cfg.enabled || !cfg.notify_admin || !to || !isMailConfigured()) return;
    const lang = isLocale(cfg.admin_locale) ? cfg.admin_locale : 'en';
    await sendMail({ to, replyTo: msg.email, ...adminContactEmail(msg, brandOf(settings), lang) });
  } catch (e) { console.error('[mail] message notification failed', e); }
}
