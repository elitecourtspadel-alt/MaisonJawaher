'use client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ScrollRail } from './scroll-rail';

/** In-page navigation: sticky side list on desktop, swipeable chip bar on mobile. Highlights the section in view. */
export function JumpLinks({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: '-20% 0px -60% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
    setActive(id);
  };

  return (
    <nav aria-label={label}>
      <p className="eyebrow mb-3 hidden lg:block">{label}</p>
      <div className="lg:hidden">
        <ScrollRail controls={false} className="-mx-5 px-5">
          {items.map((i) => (
            <a key={i.id} href={`#${i.id}`} onClick={(e) => go(e, i.id)} className={`shrink-0 snap-start rounded-full border px-4 py-2 text-sm transition ${active === i.id ? 'border-brand bg-brand text-brand-fg' : 'border-line'}`}>{i.label}</a>
          ))}
        </ScrollRail>
      </div>
      <ul className="relative hidden border-l border-line lg:block">
        {items.map((i) => (
          <li key={i.id} className="relative">
            {active === i.id && <motion.span layoutId="jump-active" className="absolute -left-px top-0 h-full w-0.5 bg-accent" />}
            <a href={`#${i.id}`} onClick={(e) => go(e, i.id)} className={`block py-2 pl-4 text-sm transition hover:text-accent ${active === i.id ? 'font-medium text-accent' : 'text-muted'}`}>{i.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
