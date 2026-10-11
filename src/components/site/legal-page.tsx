import Link from 'next/link';
import { getSettings } from '@/lib/settings';
import { getDict, text, type Locale } from '@/lib/i18n';
import { legal, type LegalBlock, type LegalKey } from '@/messages/legal';
import { JumpLinks } from '@/components/ui/jump-links';
import { LogoMark } from './logo';

/** Privacy policy / terms of use. The wording lives in messages/legal.ts; the shop's own details are filled in from the settings. */
export async function LegalPage({ locale, doc }: { locale: Locale; doc: LegalKey }) {
  const [settings] = await Promise.all([getSettings()]);
  const t = getDict(locale);
  const d = legal[locale][doc];
  const other: LegalKey = doc === 'privacy' ? 'terms' : 'privacy';
  const fill = (s: string) => s
    .replaceAll('{email}', settings.email)
    .replaceAll('{phone}', settings.phone)
    .replaceAll('{place}', text(settings.address, locale) || 'Morocco');

  const block = (b: LegalBlock, i: number) => Array.isArray(b)
    ? <ul key={i} className="my-4 space-y-2.5 ps-1">{b.map((li, k) => <li key={k} className="flex gap-3 leading-relaxed"><span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rotate-45 bg-accent" /><span>{fill(li)}</span></li>)}</ul>
    : <p key={i} className="mt-4 first:mt-0">{fill(b)}</p>;

  return (
    <div className="container-x py-12 sm:py-20">
      <header className="mb-12 flex items-center gap-6">
        <LogoMark className="hidden h-24 shrink-0 text-brand dark:text-accent sm:block" />
        <div>
          <p className="eyebrow">{t.brand}</p>
          <h1 className="section-title mt-3">{d.title}</h1>
          <p className="mt-3 text-muted">{d.subtitle}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">{d.updatedLabel} · {d.updated}</p>
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[14rem_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start"><JumpLinks items={d.sections.map((s) => ({ id: s.id, label: s.title }))} label={t.common.onThisPage} /></aside>
        <div className="max-w-2xl">
          {d.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="border-t border-line py-9 first:border-0 first:pt-0">
              <p className="font-display text-sm tracking-[0.3em] text-accent" aria-hidden>{String(i + 1).padStart(2, '0')}</p>
              <h2 className="mt-1 font-display text-3xl sm:text-4xl">{s.title}</h2>
              <div className="mt-4 text-[1.05rem] leading-relaxed text-muted">{s.blocks.map(block)}</div>
            </section>
          ))}
          <div className="card mt-6 p-6 sm:p-8">
            <h2 className="font-display text-2xl">{d.contactTitle}</h2>
            <p className="mt-2 text-muted">{fill(d.contactBody)}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={`mailto:${settings.email}`} className="btn btn-primary">{t.footer.contact}</a>
              <Link href={`/${locale}/${other}`} className="btn btn-outline">{legal[locale][other].title}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
