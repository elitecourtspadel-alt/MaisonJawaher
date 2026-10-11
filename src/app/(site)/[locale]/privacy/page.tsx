import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { legal } from '@/messages/legal';
import { LegalPage } from '@/components/site/legal-page';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = legal[locale].privacy;
  return { title: d.title, description: d.subtitle, alternates: { canonical: `/${locale}/privacy`, languages: { en: '/en/privacy', fr: '/fr/privacy' } } };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} doc="privacy" />;
}
