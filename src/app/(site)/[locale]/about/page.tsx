import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDict, isLocale, loc } from '@/lib/i18n';
import { getFaqs } from '@/lib/data';
import { JumpLinks } from '@/components/ui/jump-links';
import { Reveal } from '@/components/ui/reveal';
import { Accordion } from '@/components/ui/accordion';
import { LogoMark } from '@/components/site/logo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    title: t.about.title, description: t.about.sections[0].body,
    alternates: { canonical: `/${locale}/about`, languages: { en: '/en/about', fr: '/fr/about' } },
  };
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const faqs = await getFaqs();
  const jumps = [...t.about.sections.map((s) => ({ id: s.id, label: s.title })), ...(faqs.length ? [{ id: 'faq', label: t.home.faqTitle }] : [])];
  return (
    <div className="container-x py-12 sm:py-20">
      <header className="mb-12 flex items-center gap-6">
        <LogoMark className="hidden h-28 shrink-0 text-brand dark:text-accent sm:block" />
        <div>
          <p className="eyebrow">Maison Jawaher</p>
          <h1 className="section-title mt-3">{t.about.title}</h1>
          <p className="mt-3 text-muted">{t.about.subtitle}</p>
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[12rem_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start"><JumpLinks items={jumps} label={t.common.onThisPage} /></aside>
        <div className="max-w-2xl space-y-16">
          {t.about.sections.map((s, i) => (
            <Reveal key={s.id}>
              <section id={s.id}>
                <p className="font-display text-5xl text-accent/60" aria-hidden>{String(i + 1).padStart(2, '0')}</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl">{s.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">{s.body}</p>
              </section>
            </Reveal>
          ))}
          {faqs.length > 0 && (
            <section id="faq">
              <h2 className="mb-6 font-display text-3xl sm:text-4xl">{t.home.faqTitle}</h2>
              <Accordion items={faqs.map((f) => ({ id: f.id, title: loc(f, 'question', locale), content: loc(f, 'answer', locale) }))} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
