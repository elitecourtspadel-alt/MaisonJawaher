import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Gem, Hand, Truck } from 'lucide-react';
import { getCategories, getFaqs, getProducts, getSlides } from '@/lib/data';
import { getDict, isLocale, loc } from '@/lib/i18n';
import { getSettings } from '@/lib/settings';
import { CollectionSlider } from '@/components/site/collection-slider';
import { CommunityCard } from '@/components/site/community-button';
import { LogoMark } from '@/components/site/logo';
import { AnnouncementMarquee } from '@/components/site/announcement-marquee';
import { ProductCard } from '@/components/site/product-card';
import { ScrollRail } from '@/components/ui/scroll-rail';
import { Reveal } from '@/components/ui/reveal';
import { Typewriter } from '@/components/ui/typewriter';
import { Accordion } from '@/components/ui/accordion';
import { Starfield } from '@/components/ui/starfield';

/** Section heading: always left-aligned, with an optional "see all" link on the right. */
function SectionHead({ eyebrow, title, href, linkText }: { eyebrow: string; title: string; href?: string; linkText?: string }) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-4">
      <div><p className="eyebrow">{eyebrow}</p><h2 className="section-title mt-3">{title}</h2></div>
      {href && linkText && <Link href={href} className="hidden shrink-0 items-center gap-2 text-sm uppercase tracking-widest text-accent sm:flex">{linkText}<ArrowRight className="size-4" /></Link>}
    </Reveal>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const [slides, categories, featured, fresh, faqs, settings] = await Promise.all([
    getSlides(), getCategories(), getProducts({ featured: true, limit: 8 }), getProducts({ isNew: true, limit: 10 }), getFaqs(), getSettings(),
  ]);
  const p = (x = '') => `/${locale}${x}`;
  const icons = [Hand, Gem, Truck];
  const tel = settings.phone.replace(/[^+\d]/g, '');

  return (
    <>
      <section className="home-brand-hero surface-wine overflow-hidden" aria-labelledby="hero-title">
        {!settings.hero_background_url && <Starfield density={0.7} className="opacity-70" />}
        {settings.hero_background_url && <>
          <Image src={settings.hero_background_url} alt="" fill sizes="100vw" preload className="pointer-events-none object-cover" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#701734]/70 to-[#3c0b1e]/85" />
        </>}
        <div className="container-x relative flex flex-col items-center text-center">
          <LogoMark className="h-40 text-[#f7ecdd] sm:h-52 lg:h-60" />
          <h1 id="hero-title" className="mt-7 max-w-4xl font-display text-[clamp(2.5rem,5.2vw,5rem)] font-normal leading-[1.08] tracking-[-0.02em]">
            {t.home.heroTitleLead}
            <em className="mt-2 block font-normal">{t.home.heroTitleAccent}</em>
          </h1>
          <p className="mt-6 max-w-[39rem] text-base leading-8 text-[#f7ecdd]/80 sm:text-lg">{t.home.heroSub}</p>
          <div className="mt-8 flex w-full flex-col justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row sm:mt-10 sm:gap-4">
            <Link href={p('/shop')} className="btn hero-shop">{t.home.ctaShop}</Link>
            <Link href={p('/about')} className="btn hero-story">{t.home.ctaStory}</Link>
          </div>
        </div>
      </section>
      <AnnouncementMarquee placement="home" />
      {/* Products precede the collection editorial. */}
      {fresh.length > 0 && (
        <section aria-labelledby="new-title" className="container-x pt-14 sm:pt-20">
          <SectionHead eyebrow={t.home.newEyebrow} title={t.home.newTitle} href={p('/shop')} linkText={t.common.viewAll} />
          <ScrollRail labels={{ left: t.common.scrollLeft, right: t.common.scrollRight }}>
            {fresh.map((pr, i) => <div key={pr.id} className="w-[62vw] max-w-72 shrink-0 snap-start sm:w-64"><ProductCard product={pr} priority={i < 2} /></div>)}
          </ScrollRail>
        </section>
      )}

      {slides.length > 0 && (
        <section className="container-x pt-14 sm:pt-20" aria-labelledby="collection-edit-title">
          <p className="eyebrow">{t.home.editEyebrow}</p>
          <h2 id="collection-edit-title" className="section-title mb-8 mt-3">{t.home.editTitle}</h2>
          <CollectionSlider slides={slides} />
        </section>
      )}

      {categories.length > 0 && (
        <section id="collections" className="container-x pt-14 sm:pt-20">
          <SectionHead eyebrow={t.home.collectionsEyebrow} title={t.home.collectionsTitle} href={p('/shop')} linkText={t.common.viewAll} />
          <ScrollRail labels={{ left: t.common.scrollLeft, right: t.common.scrollRight }}>
            {categories.map((c) => (
              <Link key={c.id} href={`${p('/shop')}?category=${c.slug}`} className={`card card-hover group relative block aspect-[3/4] w-[68%] shrink-0 snap-start overflow-hidden sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)] ${categories.length > 4 ? 'xl:w-[calc((100%-6rem)/5)]' : ''}`}>
                {c.image_url
                  ? <Image src={c.image_url} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 68vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  : <div className="surface-wine absolute inset-0" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2b0b12]/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="font-display text-3xl">{loc(c, 'name', locale)}</h3>
                  <span className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#e9c887]">{t.common.discover}<ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></span>
                </div>
              </Link>
            ))}
          </ScrollRail>
        </section>
      )}

      {featured.length > 0 && (
        <section className="container-x pt-14 sm:pt-20">
          <SectionHead eyebrow={t.home.featuredEyebrow} title={t.home.featuredTitle} href={p('/shop')} linkText={t.nav.allPieces} />
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {featured.map((pr, i) => <Reveal key={pr.id} delay={(i % 4) * 80}><ProductCard product={pr} /></Reveal>)}
          </div>
          <div className="mt-8 sm:hidden"><Link href={p('/shop')} className="btn btn-outline w-full">{t.nav.allPieces}</Link></div>
        </section>
      )}

      <section className="container-x pt-14 sm:pt-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {t.home.promises.map((x, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={x.t} delay={i * 100} className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full border border-accent/40 text-accent"><Icon className="size-5" strokeWidth={1.5} /></span>
                <div><h3 className="font-display text-xl">{x.t}</h3><p className="mt-1 text-sm text-muted">{x.d}</p></div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {settings.show_community_button && settings.whatsapp_community_url && (
        <section className="container-x pt-14 sm:pt-20"><CommunityCard /></section>
      )}

      {/* Phone number, typed out once it scrolls into view */}
      <section className="surface-wine mt-14 overflow-hidden py-16 sm:mt-20 sm:py-24">
        <Starfield density={0.7} className="opacity-70" />
        <div className="container-x relative">
          <p className="eyebrow !text-[#e9c887]">{t.home.typeLead}</p>
          <p className="mt-5 font-display text-[clamp(2rem,8vw,4.75rem)] leading-none" dir="ltr">
            <Typewriter text={settings.phone} href={`tel:${tel}`} className="gold-text" />
          </p>
          <p className="mt-5 max-w-md text-white/75">{t.contact.subtitle}</p>
          <Link href={p('/contact')} className="btn btn-gold mt-7">{t.nav.contact}</Link>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="container-x pb-4 pt-14 sm:pt-20">
          <SectionHead eyebrow={t.home.faqEyebrow} title={t.home.faqTitle} />
          <Accordion items={faqs.map((f) => ({ id: f.id, title: loc(f, 'question', locale), content: loc(f, 'answer', locale) }))} />
        </section>
      )}
    </>
  );
}
