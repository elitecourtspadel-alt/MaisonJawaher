'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useSite } from '@/components/site-context';

/** Round "back to top" button with a gold ring that fills as you scroll down the page. */
export function BackToTop() {
  const { t } = useSite();
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
      setShow(y > 500);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const C = 2 * Math.PI * 22;
  return (
    <AnimatePresence>
      {show && (
        <motion.button type="button" aria-label={t.common.backToTop} title={t.common.backToTop}
          initial={{ opacity: 0, scale: 0.6, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6, y: 16 }} transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
          className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 grid size-14 place-items-center rounded-full border border-[var(--glass-line)] bg-[var(--glass)] text-fg shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:text-accent">
          <svg viewBox="0 0 52 52" className="absolute inset-0 size-full -rotate-90" aria-hidden>
            <circle cx="26" cy="26" r="22" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="2" />
            <circle cx="26" cy="26" r="22" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
          </svg>
          <ArrowUp className="relative size-5 transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={1.8} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
