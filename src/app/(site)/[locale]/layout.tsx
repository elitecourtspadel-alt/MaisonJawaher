import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../../globals.css';
import { fontVars } from '@/lib/fonts';
import { getDict, isLocale, loc, locales, text } from '@/lib/i18n';
import { getSettings } from '@/lib/settings';
import { getAnnouncements, getCategories } from '@/lib/data';
import { Providers } from '@/components/providers';
import { ThemeScript } from '@/components/theme-script';
import { Analytics } from '@/components/analytics';
import { SiteProvider } from '@/components/site-context';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { AnnouncementMarquee } from '@/components/site/announcement-marquee';
import { WhatsAppChat } from '@/components/site/whatsapp-chat';
import { BackToTop } from '@/components/site/back-to-top';
import { Starfield } from '@/components/ui/starfield';
import { backendMessage, getBackendStatus } from '@/lib/backend-status';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#fcf8f1' }, { media: '(prefers-color-scheme: dark)', color: '#2a1b20' }],
};

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const s = await getSettings();
  const title = text(s.site_title, locale);
  const description = text(s.site_description, locale);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: '%s | Maison Jawaher' },
    description,
    applicationName: 'Maison Jawaher',
    alternates: { canonical: `/${locale}`, languages: { en: '/en', fr: '/fr', 'x-default': '/fr' } },
    openGraph: { siteName: 'Maison Jawaher', title, description, locale: locale === 'fr' ? 'fr_MA' : 'en_US', alternateLocale: locale === 'fr' ? ['en_US'] : ['fr_MA'], type: 'website', images: [{ url: '/logo.png', width: 700, height: 930, alt: 'Maison Jawaher' }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/logo.png'] },
    icons: { icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' }], apple: '/apple-touch-icon.png' },
    robots: { index: true, follow: true },
  };
}

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [settings, categories, announcements, backend] = await Promise.all([getSettings(), getCategories(), getAnnouncements(), getBackendStatus()]);
  const nav = categories.map((c) => ({ slug: c.slug, name: loc(c, 'name', locale) })).filter((c) => c.name);
  const bar = announcements.map((a) => ({ id: a.id, message: loc(a, 'message', locale) })).filter((a) => a.message);

  const org = {
    '@context': 'https://schema.org', '@type': ['Organization', 'JewelryStore'], name: 'Maison Jawaher', areaServed: 'MA', currenciesAccepted: settings.currency, paymentAccepted: 'Cash on delivery',
    address: { '@type': 'PostalAddress', addressCountry: 'MA', addressLocality: text(settings.address, locale) || undefined }, url: `${siteUrl()}/${locale}`, logo: `${siteUrl()}/logo.png`,
    email: settings.email, telephone: settings.phone, sameAs: settings.socials.filter((s) => s.enabled && s.url).map((s) => s.url),
  };
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Maison Jawaher', url: `${siteUrl()}/${locale}`, inLanguage: locale };

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth" className={fontVars}>
      <body className="isolate">
        <ThemeScript />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([org, website]).replace(/</g, '\\u003c') }} />
        <Providers>
          <SiteProvider locale={locale} t={getDict(locale)} settings={settings} categories={nav} announcements={bar}>
            <Starfield viewport density={0.7} className="opacity-70" />
            <div className="relative z-10">
            <Header />
            <AnnouncementMarquee />
            {backend !== 'ready' && <div role="status" className="container-x my-6"><p className="rounded-2xl border border-accent/30 bg-surface px-6 py-5 text-sm leading-7">{backendMessage(backend, locale)}</p></div>}
            <main id="main">{children}</main>
            <Footer />
            <WhatsAppChat />
            <BackToTop />
            </div>
          </SiteProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
