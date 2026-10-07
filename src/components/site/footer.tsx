'use client';
import { Starfield } from '@/components/ui/starfield';
import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useSite } from '@/components/site-context';
import { SocialIcons } from './social-icons';
import { LogoMark } from './logo';

export function Footer() {
  const { t, settings, path, address, categories } = useSite();
  const tel = settings.phone.replace(/[^+\d]/g, '');
  const links = [
    { href: path('/'), label: t.nav.home }, { href: path('/shop'), label: t.nav.shop },
    { href: path('/about'), label: t.nav.about }, { href: path('/contact'), label: t.nav.contact }, { href: path('/cart'), label: t.nav.cart },
  ];
  const today = (new Date().getDay() + 6) % 7;
  const hours = settings.hours[today];

  return (
    <footer className="surface-wine mt-24 overflow-hidden">
      <Starfield density={0.7} className="opacity-70" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8b470] to-transparent" />

      <div className="container-x relative">
        <div className={`footer-reveal grid gap-12 pb-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.2fr] pt-14`}>
          <div>
            <LogoMark className="h-28 text-[#f7ecdd]" />
            <p className="mt-5 max-w-xs font-display text-2xl leading-snug">{t.tagline}</p>
            <SocialIcons links={settings.socials} className="mt-6 text-[#f7ecdd]" />
          </div>

          <nav aria-label={t.footer.explore}>
            <h2 className="eyebrow mb-5 !text-[#e9c887]">{t.footer.explore}</h2>
            <ul className="space-y-3">
              {links.map((l) => <li key={l.href}><Link href={l.href} className="link-slide text-[0.95rem]">{l.label}</Link></li>)}
            </ul>
          </nav>

          {categories.length > 0 && (
            <nav aria-label={t.footer.collections}>
              <h2 className="eyebrow mb-5 !text-[#e9c887]">{t.footer.collections}</h2>
              <ul className="space-y-3">
                {categories.map((c) => <li key={c.slug}><Link href={`${path('/shop')}?category=${c.slug}`} className="link-slide text-[0.95rem]">{c.name}</Link></li>)}
              </ul>
            </nav>
          )}

          <div>
            <h2 className="eyebrow mb-5 !text-[#e9c887]">{t.footer.contact}</h2>
            <ul className="space-y-4 text-[0.95rem]">
              <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-[#e9c887]" strokeWidth={1.6} /><a href={`tel:${tel}`} className="link-slide" dir="ltr">{settings.phone}</a></li>
              <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-[#e9c887]" strokeWidth={1.6} /><a href={`mailto:${settings.email}`} className="link-slide break-all">{settings.email}</a></li>
              {settings.show_location && address && (
                <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[#e9c887]" strokeWidth={1.6} />
                  {settings.map_url ? <a href={settings.map_url} target="_blank" rel="noopener noreferrer" className="link-slide">{address}</a> : <span>{address}</span>}
                </li>
              )}
              {hours && (
                <li className="flex gap-3 text-white/70"><Clock className="mt-0.5 size-4 shrink-0 text-[#e9c887]" strokeWidth={1.6} /><span dir="ltr">{t.contact.days[today]}: {hours.closed ? t.contact.closed : `${hours.open} – ${hours.close}`}</span></li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 pb-[max(5rem,env(safe-area-inset-bottom))] text-xs text-white/65 sm:flex-row sm:px-20 sm:pb-5">
          <p>© {new Date().getFullYear()} {t.brand}. {t.footer.rights}</p>
          <nav aria-label={t.footer.legal} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            <Link href={path('/privacy')} className="transition hover:text-[#e9c887]">{t.footer.privacy}</Link>
            <Link href={path('/terms')} className="transition hover:text-[#e9c887]">{t.footer.terms}</Link>
            <span>{t.footer.madeIn}</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
