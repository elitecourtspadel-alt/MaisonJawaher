'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';
import type { EmailSettings, Language, SiteSettings } from '@/lib/types';
import { saveEmailSettings, saveSettings, sendTestEmail } from '@/app/(admin)/admin/actions/settings';
import { CircleAlert, CircleCheck, Eye } from 'lucide-react';
import { Select } from '@/components/ui/floating';
import { PageHeader, useAdmin } from './shell';
import { useRun } from './bits';
import { Field, FormSection, Switch } from '@/components/ui/field';
import { SlideTabs } from '@/components/ui/slide-tabs';
import { socialMeta } from '@/components/site/social-icons';
import { LangFields, type TrValue } from './lang-fields';

const tabs = [{ value: 'general', label: 'General' }, { value: 'security', label: 'Security' }, { value: 'contact', label: 'Contact & hours' }, { value: 'social', label: 'Social & WhatsApp' }, { value: 'email', label: 'Email' }];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type TextKey = 'address' | 'site_title' | 'site_description' | 'community_title' | 'community_message';
const TEXT_KEYS: TextKey[] = ['address', 'site_title', 'site_description', 'community_title', 'community_message'];
const toTexts = (s: SiteSettings, languages: Language[]): TrValue =>
  Object.fromEntries(languages.map((l) => [l.code, { address: s.address[l.code] ?? '', site_title: s.site_title[l.code] ?? '', site_description: s.site_description[l.code] ?? '', community_title: s.community_title[l.code] ?? '', community_message: s.community_message[l.code] ?? '' }]));
const fromTexts = (t: TrValue, key: TextKey, languages: Language[]) => Object.fromEntries(languages.map((l) => [l.code, t[l.code]?.[key] ?? '']));

export type MailStatus = { configured: boolean; host: string; from: string };

export function SettingsForm({ settings, email, mail, languages }: { settings: SiteSettings; email: EmailSettings; mail: MailStatus; languages: Language[] }) {
  const { can } = useAdmin();
  const readOnly = !can('settings.update');
  const [tab, setTab] = useState('general');
  const [s, setS] = useState<SiteSettings>(settings);
  const [texts, setTexts] = useState<TrValue>(() => toTexts(settings, languages));
  const [m, setM] = useState<EmailSettings>(email);
  const [testTo, setTestTo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, pending } = useRun();
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const txt = (k: 'phone' | 'email' | 'map_url' | 'whatsapp_number' | 'whatsapp_community_url' | 'currency') => ({ value: s[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value), error: errors[k] });
  const setText = (locale: string, field: string, v: string) => setTexts((x) => ({ ...x, [locale]: { ...x[locale], [field]: v } }));

  const save = async (keys: (keyof SiteSettings)[]) => {
    const patch: Record<string, unknown> = Object.fromEntries(keys.map((k) => [k, s[k]]));
    for (const k of TEXT_KEYS) if (keys.includes(k)) patch[k] = fromTexts(texts, k, languages);
    const r = await run(() => saveSettings(patch as Partial<SiteSettings>), { title: 'Settings saved', message: 'Your changes are now live on the website.' });
    setErrors(r.ok ? {} : r.fieldErrors ?? {});
  };
  const bar = (keys: (keyof SiteSettings)[]) => !readOnly && <div className="flex justify-end"><button type="button" className="btn btn-primary" disabled={pending} onClick={() => save(keys)}>{pending ? 'Saving…' : 'Save changes'}</button></div>;

  const saveMail = async () => {
    const r = await run(() => saveEmailSettings(m), { title: 'Email settings saved', message: 'The website will follow these choices from now on.' });
    setErrors(r.ok ? {} : r.fieldErrors ?? {});
  };

  return (
    <>
      <PageHeader title="Settings" description="What visitors see: prices, contact details, opening hours, social links and more." />
      {readOnly && <p className="mb-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm"><Eye className="size-5 shrink-0 text-accent" />You can look at the settings but your role does not allow changes.</p>}
      <div className="mb-8"><SlideTabs tabs={tabs} value={tab} onChange={setTab} label="Settings sections" /></div>

      <fieldset disabled={readOnly} className="grid min-w-0 gap-6 border-0 p-0">
        {tab === 'security' && <>
          <FormSection title="Admin session" description="Applies only to the admin portal. A warning appears one minute before inactivity signs you out. Activity is shared across your admin tabs.">
            <Field label="Idle timeout in minutes" type="number" min={5} max={240} value={s.admin_idle_timeout_minutes} onChange={(e) => set('admin_idle_timeout_minutes', Number(e.target.value))} error={errors.admin_idle_timeout_minutes} hint="Between 5 and 240 minutes. Default: 30 minutes." />
          </FormSection>
          <FormSection title="Wrong password protection" description="After too many wrong passwords for the same admin account, that account is blocked for a while, even if the correct password is then entered. The block ends by itself. The counter resets after a successful sign-in.">
            <Field label="Wrong passwords allowed" type="number" min={1} max={20} value={s.admin_max_failed_logins} onChange={(e) => set('admin_max_failed_logins', Number(e.target.value))} error={errors.admin_max_failed_logins} hint="Between 1 and 20. Default: 5 attempts." />
            <Field label="Block duration in minutes" type="number" min={1} max={1440} value={s.admin_lockout_minutes} onChange={(e) => set('admin_lockout_minutes', Number(e.target.value))} error={errors.admin_lockout_minutes} hint="Between 1 and 1440 minutes (24 hours). Default: 15 minutes." />
          </FormSection>
          <FormSection title="Trusted devices" description="After verifying 2FA, admins can remember a private browser and skip the code on later password sign-ins. Idle timeout still applies. At the device limit, admins must confirm replacing the least recently used device. Reducing the limit removes excess saved devices immediately.">
            <Switch label="Allow trusted devices" checked={s.admin_trusted_devices_enabled} onChange={(v) => set('admin_trusted_devices_enabled', v)} />
            <Field label="Trust period in days" type="number" min={1} max={90} value={s.admin_trusted_device_days} onChange={(e) => set('admin_trusted_device_days', Number(e.target.value))} error={errors.admin_trusted_device_days} hint="Default: 30 days. Between 1 and 90 days." />
            <Field label="Maximum trusted devices per admin" type="number" min={1} max={10} value={s.admin_max_trusted_devices} onChange={(e) => set('admin_max_trusted_devices', Number(e.target.value))} error={errors.admin_max_trusted_devices} hint="Default: 2. Between 1 and 10 devices." />
          </FormSection>
          {bar(['admin_idle_timeout_minutes', 'admin_max_failed_logins', 'admin_lockout_minutes', 'admin_trusted_devices_enabled', 'admin_trusted_device_days', 'admin_max_trusted_devices'])}
        </>}
        {tab === 'general' && (
          <>
            <FormSection title="Shop">
              <Switch label="Show prices" hint="Off hides product prices throughout the website. Prices are hidden by default." checked={s.show_prices} onChange={(v) => set('show_prices', v)} />
              <Field label="Currency code" hint="For example MAD" {...txt('currency')} />
            </FormSection>
            <FormSection title="Site title and description" description="Used by Google and when the site is shared. Keep the title under 60 characters and the description under 160.">
              <LangFields languages={languages} value={texts} onChange={setText}
                fields={[{ key: 'site_title', label: 'Site title' }, { key: 'site_description', label: 'Site description', kind: 'textarea', rows: 3 }]} />
            </FormSection>
            {bar(['show_prices', 'currency', 'site_title', 'site_description'])}
          </>
        )}

        {tab === 'contact' && (
          <>
            <FormSection title="Contact details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone number" placeholder="+212 6 00 00 00 00" {...txt('phone')} />
                <Field label="Public email" type="email" {...txt('email')} />
              </div>
            </FormSection>
            <FormSection title="Shop location" description="Turn this off if you do not want customers to see where you are, for example if you work from home.">
              <Switch label="Show the shop location" hint="Controls the address and map link in the footer and on the contact page." checked={s.show_location} onChange={(v) => set('show_location', v)} />
              <LangFields languages={languages} value={texts} onChange={setText} fields={[{ key: 'address', label: 'Address' }]} />
              <Field label="Google Maps link" placeholder="https://maps.google.com/…" {...txt('map_url')} />
            </FormSection>
            <FormSection title="Opening hours">
              <div className="grid gap-3">
                {DAYS.map((d, i) => {
                  const h = s.hours[i];
                  const upd = (p: Partial<typeof h>) => set('hours', s.hours.map((x, k) => (k === i ? { ...x, ...p } : x)));
                  return (
                    <div key={d} className="grid grid-cols-[5.5rem_1fr_1fr] items-center gap-3 sm:grid-cols-[8rem_1fr_1fr_auto]">
                      <span className="text-sm font-medium">{d}</span>
                      <input type="time" aria-label={`${d} opens`} className="input !min-h-10" disabled={h.closed} value={h.open} onChange={(e) => upd({ open: e.target.value })} />
                      <input type="time" aria-label={`${d} closes`} className="input !min-h-10" disabled={h.closed} value={h.close} onChange={(e) => upd({ close: e.target.value })} />
                      <label className="col-span-3 flex items-center gap-2 text-sm sm:col-span-1"><input type="checkbox" checked={h.closed} onChange={(e) => upd({ closed: e.target.checked })} className="size-4 accent-[var(--brand)]" />Closed</label>
                    </div>
                  );
                })}
              </div>
              {errors.hours && <p role="alert" className="text-sm text-danger">{errors.hours}</p>}
            </FormSection>
            {bar(['phone', 'email', 'show_location', 'address', 'map_url', 'hours'])}
          </>
        )}

        {tab === 'social' && (
          <>
            <FormSection title="WhatsApp">
              <Field label="WhatsApp number for chat and orders" hint="Digits only, with the country code, for example 212600000000" inputMode="numeric" {...txt('whatsapp_number')} />
              <Field label="WhatsApp community invite link" placeholder="https://chat.whatsapp.com/…" {...txt('whatsapp_community_url')} />
              <LangFields languages={languages} value={texts} onChange={setText}
                fields={[{ key: 'community_title', label: 'Community invitation heading', placeholder: 'Join our WhatsApp community' }, { key: 'community_message', label: 'Community invitation message', kind: 'textarea', rows: 3, placeholder: 'New pieces and offers are shared with the group first.' }]} />
              <Switch label="Show the “Join our community” invitation" hint="On the home page and contact page" checked={s.show_community_button} onChange={(v) => set('show_community_button', v)} />
            </FormSection>
            <FormSection title="Social networks" description="Networks that are switched on and have a link appear in the footer and on the contact page.">
              {s.socials.map((l, i) => {
                const meta = socialMeta[l.platform];
                if (!meta) return null;
                const upd = (p: Partial<typeof l>) => set('socials', s.socials.map((x, k) => (k === i ? { ...x, ...p } : x)));
                return (
                  <div key={l.platform} className="grid items-center gap-3 sm:grid-cols-[9rem_1fr_auto]">
                    <span className="flex items-center gap-3 text-sm font-medium"><meta.Icon className="size-5" />{meta.label}</span>
                    <input className="input !min-h-10" placeholder="https://…" aria-label={`${meta.label} link`} value={l.url} onChange={(e) => upd({ url: e.target.value, enabled: !!e.target.value })} />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--brand)]" checked={l.enabled} onChange={(e) => upd({ enabled: e.target.checked })} />Show</label>
                  </div>
                );
              })}
              {errors.socials && <p role="alert" className="text-sm text-danger">{errors.socials}</p>}
            </FormSection>
            {bar(['whatsapp_number', 'whatsapp_community_url', 'show_community_button', 'community_title', 'community_message', 'socials'])}
          </>
        )}

        {tab === 'email' && (
          <>
            <section className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${mail.configured ? 'border-ok/40 bg-ok/10' : 'border-danger/40 bg-danger/10'}`}>
              {mail.configured ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-ok" /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" />}
              <div>
                <p className="font-medium">{mail.configured ? 'The mail server is set up' : 'The mail server is not set up yet'}</p>
                <p className="mt-0.5 text-muted">
                  {mail.configured
                    ? <>Emails are sent from <b className="font-medium text-fg">{mail.from}</b> through <b className="font-medium text-fg">{mail.host}</b>. These details live in the environment settings of the site, so they cannot be changed here.</>
                    : <>Add <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code> and <code>MAIL_FROM_EMAIL</code> to the environment settings of the site and restart it. Until then no email can be sent, whatever you choose below.</>}
                </p>
              </div>
            </section>
            <FormSection title="Email notifications" description="Choose what the website emails. Orders and messages are always saved in the portal, with or without email.">
              <Switch label="Send emails" hint="The master switch. Off means the website sends no email at all." checked={m.enabled} onChange={(v) => setM({ ...m, enabled: v })} />
              <Switch label="Email me about new orders and messages" hint="An alert to the admin address below each time a customer orders or writes to you." disabled={!m.enabled} checked={m.notify_admin} onChange={(v) => setM({ ...m, notify_admin: v })} />
              <Switch label="Email customers an order confirmation" hint="Sent only when the customer typed an email address in the order form." disabled={!m.enabled} checked={m.notify_customer} onChange={(v) => setM({ ...m, notify_customer: v })} />
            </FormSection>
            <FormSection title="Admin email" description="Where the alerts for you are delivered.">
              <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
                <Field label="Admin email address" type="email" hint="Leave empty to use the public email from the Contact tab." value={m.admin_email} onChange={(e) => setM({ ...m, admin_email: e.target.value })} error={errors.admin_email} />
                <Select label="Language of the alerts" value={m.admin_locale} onChange={(v) => setM({ ...m, admin_locale: v })} options={languages.filter((l) => l.code === 'en' || l.code === 'fr').map((l) => ({ value: l.code, label: l.native_name || l.name }))} />
              </div>
            </FormSection>
            {!readOnly && <div className="flex justify-end"><button type="button" className="btn btn-primary" disabled={pending} onClick={saveMail}>{pending ? 'Saving…' : 'Save email settings'}</button></div>}
            <FormSection title="Send a test email" description="Checks that the mail server accepts and delivers a message. It is sent even when emails are switched off above.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1"><Field label="Send it to" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} /></div>
                <button type="button" className="btn btn-outline" disabled={pending || !testTo || !mail.configured} onClick={() => run(() => sendTestEmail(testTo, m.admin_locale), { title: 'Test email sent', message: `On its way to ${testTo}. It should arrive within a minute.` })}><Send className="size-4" />Send test</button>
              </div>
            </FormSection>
          </>
        )}
      </fieldset>
    </>
  );
}
