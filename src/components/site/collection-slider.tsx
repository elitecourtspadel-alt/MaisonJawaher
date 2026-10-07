'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { Slide } from '@/lib/types';
import { loc } from '@/lib/i18n';
import { useSite } from '@/components/site-context';

export function CollectionSlider({ slides }: { slides: Slide[] }) {
  const { locale, t } = useSite();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = slides.length;
  const go = useCallback((direction: number) => setIndex((i) => (i + direction + count) % count), [count]);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    const visibility = () => setHidden(document.hidden);
    update(); visibility();
    query.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => { query.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (count < 2 || paused || hovered || hidden || reduced) return;
    const timer = setTimeout(() => go(1), 6500);
    return () => clearTimeout(timer);
  }, [index, count, paused, hovered, hidden, reduced, go]);
  if (!count) return null;
  const slide = slides[index % count];
  const title = loc(slide, 'title', locale);
  const subtitle = loc(slide, 'subtitle', locale);
  const label = loc(slide, 'cta_label', locale);
  return (
    <div className="group/slide overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow)] transition-shadow duration-500 hover:shadow-[0_28px_56px_-28px_rgba(60,10,20,0.5)]" role="region" aria-roledescription="carousel" aria-label={t.home.editTitle}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setHovered(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false); }}>
      <div className="relative flex h-[38rem] flex-col bg-surface-2 md:h-[36rem]">
        <div className="relative min-h-0 w-full flex-1">
          <Image key={slide.id} src={slide.image_url} alt={title || t.brand} fill sizes="100vw" className="slide-image object-contain transition-transform duration-[1400ms] ease-out group-hover/slide:scale-[1.03] motion-reduce:transition-none" />
        </div>
        <div className="flex h-[17rem] w-full shrink-0 flex-col gap-5 overflow-auto bg-[#3c0b1e] p-5 text-[#faf5ec] md:absolute md:inset-x-0 md:bottom-0 md:h-auto md:max-h-full md:flex-row md:items-end md:justify-between md:bg-transparent md:p-6" aria-live={paused || hovered || reduced ? 'polite' : 'off'}>
          <div className="flex max-w-sm flex-col items-start md:rounded-xl md:bg-black/65 md:p-5">
          <p className="eyebrow">{t.home.eyebrow}</p>
          {title && <h3 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{title}</h3>}
          {subtitle && <p className="mt-3 text-base leading-7 text-[#faf5ec]/90">{subtitle}</p>}
          {label && slide.cta_url && <Link className="btn btn-primary mt-5" href={slide.cta_url.startsWith('/') ? `/${locale}${slide.cta_url}` : slide.cta_url}>{label}</Link>}
          </div>
          {count > 1 && (
            <div className="flex shrink-0 items-center gap-3 md:rounded-full md:bg-black/65 md:p-2">
              <button type="button" className="grid size-11 place-items-center rounded-full slider-btn border border-white/35 bg-black/20" aria-label={t.common.previous} onClick={() => go(-1)}><ChevronLeft className="size-4" /></button>
              <span className="text-sm tabular-nums">{index % count + 1} / {count}</span>
              <button type="button" className="grid size-11 place-items-center rounded-full slider-btn border border-white/35 bg-black/20" aria-label={t.common.next} onClick={() => go(1)}><ChevronRight className="size-4" /></button>
              {!reduced && <button type="button" className="ml-auto grid size-11 place-items-center rounded-full slider-btn border border-white/35 bg-black/20 lg:ml-4" aria-label={locale === 'fr' ? (paused ? 'Reprendre le diaporama' : 'Mettre en pause le diaporama') : (paused ? 'Play slideshow' : 'Pause slideshow')} onClick={() => setPaused((p) => !p)}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
