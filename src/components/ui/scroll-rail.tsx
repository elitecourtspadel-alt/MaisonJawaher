'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Horizontal scroller: fading edge masks that react to scroll position + left/right controls. */
export function ScrollRail({ children, className = '', labels = { left: 'Scroll left', right: 'Scroll right' }, controls = true }: {
  children: ReactNode; className?: string; labels?: { left: string; right: string }; controls?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ l: false, r: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const l = el.scrollLeft > 4;
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    el.style.setProperty('--l', l ? '1' : '0');
    el.style.setProperty('--r', r ? '1' : '0');
    setEdge((p) => (p.l === l && p.r === r ? p : { l, r }));
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [update]);

  const go = (dir: -1 | 1) => ref.current?.scrollBy({ left: dir * Math.max(240, ref.current.clientWidth * 0.8), behavior: 'smooth' });
  const btn = 'absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/90 shadow-lg backdrop-blur transition hover:border-accent hover:text-accent active:scale-95 disabled:pointer-events-none disabled:opacity-0 sm:grid';

  return (
    <div className={`relative ${className}`}>
      <div ref={ref} onScroll={update} tabIndex={0} className="fade-x no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 outline-offset-4 sm:gap-6">
        {children}
      </div>
      {controls && (
        <>
          <button type="button" aria-label={labels.left} disabled={!edge.l} onClick={() => go(-1)} className={`${btn} left-1`}><ChevronLeft className="size-5" /></button>
          <button type="button" aria-label={labels.right} disabled={!edge.r} onClick={() => go(1)} className={`${btn} right-1`}><ChevronRight className="size-5" /></button>
        </>
      )}
    </div>
  );
}
