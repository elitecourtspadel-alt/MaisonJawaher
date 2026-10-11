'use client';
import { useId } from 'react';
import { motion } from 'motion/react';
import { ScrollRail } from './scroll-rail';

/** Pill tabs with a sliding background (shared-layout animation). */
export function SlideTabs({ tabs, value, onChange, label, controls = false }: { tabs: { value: string; label: string }[]; value: string; onChange: (v: string) => void; label: string; controls?: boolean }) {
  const id = useId();
  return (
    <ScrollRail controls={controls} className="max-w-full -mx-5 px-5 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label={label} className="flex w-max gap-1 rounded-full border border-line bg-surface p-1.5">
        {tabs.map((t) => (
          <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
            className={`relative shrink-0 snap-start rounded-full px-5 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors ${value === t.value ? 'text-brand-fg' : 'hover:text-accent'}`}>
            {value === t.value && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-full bg-brand" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>
    </ScrollRail>
  );
}
