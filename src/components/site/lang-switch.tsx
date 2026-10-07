'use client';
import { usePathname } from 'next/navigation';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { FloatingMenu } from '@/components/ui/floating';
import { useSite } from '@/components/site-context';
import { locales } from '@/lib/i18n';

/**
 * Switching language is a full page load on purpose (a plain link, not a client-side navigation): the whole <html lang> changes,
 * and re-rendering the document shell in the browser makes React 19 complain about the <script> tags in it.
 */
/** Globe icon + the current language written out in full ("Français"); the list shows each language in its own name. */
export function LangSwitch() {
  const { locale, t } = useSite();
  const pathname = usePathname() || `/${locale}`;
  const swap = (l: string) => pathname.replace(/^\/(en|fr)(?=\/|$)/, `/${l}`);
  const setCookie = (l: string) => { document.cookie = `mj-locale=${l}; path=/; max-age=31536000; samesite=lax`; };
  return (
    <FloatingMenu trigger={({ open, props }) => (
      <button type="button" aria-label={`${t.lang.label}: ${t.lang[locale]}`} {...props} className="flex h-11 items-center gap-2 rounded-full px-3 text-sm transition hover:bg-accent/15 hover:text-accent">
        <Globe className="size-[1.15rem]" strokeWidth={1.5} />
        <span className="hidden sm:inline">{t.lang[locale]}</span>
        <span className="text-xs font-medium uppercase tracking-widest sm:hidden">{locale}</span>
        <ChevronDown className={`hidden size-3.5 opacity-60 transition sm:block ${open ? 'rotate-180' : ''}`} />
      </button>
    )}>
      {(close) => locales.map((l) => (
        <a key={l} href={swap(l) + (typeof window === 'undefined' ? '' : window.location.search + window.location.hash)} hrefLang={l} lang={l} role="menuitem" onClick={() => { setCookie(l); close(); }}
          className={`flex items-center justify-between gap-8 rounded-xl px-3.5 py-2.5 text-sm transition hover:bg-accent/15 ${l === locale ? 'text-accent' : ''}`}>
          <span className="flex items-center gap-3"><span className="w-6 text-[0.65rem] font-medium uppercase tracking-widest opacity-60">{l}</span>{t.lang[l]}</span>
          {l === locale && <Check className="size-4" />}
        </a>
      ))}
    </FloatingMenu>
  );
}
