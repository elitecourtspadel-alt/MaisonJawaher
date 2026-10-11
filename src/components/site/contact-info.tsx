'use client';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useSite } from '@/components/site-context';
import { Typewriter } from '@/components/ui/typewriter';
import { SocialIcons } from './social-icons';

export function ContactInfo() {
  const { t, settings, address } = useSite();
  const tel = settings.phone.replace(/[^+\d]/g, '');
  const today = (new Date().getDay() + 6) % 7; // Monday = 0
    return (
    <div className="grid gap-5">
      <div className="card p-6">
        <p className="eyebrow mb-3 flex items-center gap-2"><Phone className="size-3.5" />{t.contact.phoneLabel}</p>
        <p className="font-display text-3xl sm:text-4xl" dir="ltr"><Typewriter text={settings.phone} href={`tel:${tel}`} className="gold-text" /></p>
      </div>
      <div className={`grid gap-5 ${settings.show_location && address ? 'sm:grid-cols-2' : ''}`}>
        <div className="card p-6"><p className="eyebrow mb-3 flex items-center gap-2"><Mail className="size-3.5" />{t.contact.emailLabel}</p><a href={`mailto:${settings.email}`} className="break-all transition hover:text-accent">{settings.email}</a></div>
        {settings.show_location && address && <div className="card p-6">
          <p className="eyebrow mb-3 flex items-center gap-2"><MapPin className="size-3.5" />{t.contact.address}</p>
          <p>{address}</p>
          {settings.map_url && <a href={settings.map_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-accent underline-offset-4 hover:underline">{t.contact.openMap}</a>}
        </div>}
      </div>
      <div className="card p-6">
        <p className="eyebrow mb-4 flex items-center gap-2"><Clock className="size-3.5" />{t.contact.hours}</p>
        <ul className="divide-y divide-line text-sm">
          {t.contact.days.map((d, i) => {
            const h = settings.hours[i];
            return (
              <li key={d} className={`flex justify-between gap-4 py-2.5 ${i === today ? 'font-medium text-accent' : ''}`}>
                <span>{d}</span><span className="tabular-nums" dir="ltr">{h?.closed ? t.contact.closed : `${h?.open} – ${h?.close}`}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <p className="eyebrow">{t.contact.followUs}</p>
        <SocialIcons links={settings.socials} className="text-fg" />
      </div>
    </div>
  );
}
