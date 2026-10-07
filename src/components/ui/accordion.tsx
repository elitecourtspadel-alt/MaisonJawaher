'use client';
import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';

export type AccordionItem = { id: string; title: string; content: ReactNode };

/** Premium accordion — every section expands independently of the others. */
export function Accordion({ items, defaultOpen = [], numbered = false }: { items: AccordionItem[]; defaultOpen?: string[]; numbered?: boolean }) {
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen));
  const base = useId();
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {items.map((it, i) => {
        const isOpen = open.has(it.id);
        return (
          <div key={it.id} className={`relative transition-colors ${isOpen ? 'bg-accent/[0.06]' : ''}`}>
            <motion.span className="absolute inset-y-0 left-0 w-0.5 bg-accent" initial={false} animate={{ scaleY: isOpen ? 1 : 0 }} style={{ originY: 0 }} />
            <h3>
              <button type="button" aria-expanded={isOpen} aria-controls={`${base}-${it.id}`} onClick={() => toggle(it.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:text-accent sm:px-6 sm:py-5">
                {numbered && <span className="font-display text-lg text-accent">{String(i + 1).padStart(2, '0')}</span>}
                <span className="flex-1 font-display text-lg font-medium sm:text-xl">{it.title}</span>
                <motion.span animate={{ rotate: isOpen ? 135 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} className="grid size-8 shrink-0 place-items-center rounded-full border border-line">
                  <Plus className="size-4" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div id={`${base}-${it.id}`} role="region" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }} className="overflow-hidden">
                  <div className="px-5 pb-5 text-[0.95rem] leading-relaxed text-muted sm:px-6 sm:pb-6 sm:pl-[4.25rem] whitespace-pre-line">{it.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
