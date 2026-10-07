import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDict, isLocale } from '@/lib/i18n';
import { ContactForm } from '@/components/site/contact-form';
import { ContactInfo } from '@/components/site/contact-info';
import { CommunityCard } from '@/components/site/community-button';
import { Starfield } from '@/components/ui/starfield';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return { title: t.contact.title, description: t.contact.subtitle, alternates: { canonical: `/${locale}/contact`, languages: { en: '/en/contact', fr: '/fr/contact' } } };
}

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <>
      <section className="surface-wine mx-3 mt-3 overflow-hidden rounded-[1.75rem] py-14 sm:mx-6 sm:rounded-[2.25rem] sm:py-20">
        <Starfield density={0.7} className="opacity-70" />
        <div className="container-x relative">
          <p className="eyebrow !text-[#e9c887]">Maison Jawaher</p>
          <h1 className="section-title mt-3 !text-[clamp(2.5rem,7vw,4.5rem)]">{t.contact.title}</h1>
          <p className="mt-4 max-w-xl text-white/75">{t.contact.subtitle}</p>
        </div>
      </section>
      <div className="container-x grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="grid content-start gap-8">
          <div className="card p-6 sm:p-9">
            <h2 className="mb-6 font-display text-3xl">{t.contact.formTitle}</h2>
            <ContactForm />
          </div>
          <CommunityCard />
        </div>
        <ContactInfo />
      </div>
    </>
  );
}
