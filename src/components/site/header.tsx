'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Gem, House, Mail, Menu, ShoppingBag, X, type LucideIcon } from 'lucide-react';
import { useCart, useSite } from '@/components/site-context';
import { LogoMark } from './logo';
import { ThemeToggle } from './theme-toggle';
import { LangSwitch } from './lang-switch';
import { SocialIcons } from './social-icons';

type Item = { href: string; label: string; icon: LucideIcon };

/**
 * Floating glass navigation. A pill slides between items following the cursor (with a slight magnetic pull
 * toward the pointer). On touch devices it simply highlights the current page.
 */
function FloatingNav({ items, pathname, label }: { items: Item[]; pathname: string; label: string }) {
  const wrap = useRef<HTMLUListElement>(null);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<{ x: number; w: number; dx: number; on: boolean; i: number }>({ x: 0, w: 0, dx: 0, on: false, i: -1 });

  const isActive = (h: string, i: number) => (i === 0 ? pathname === h : pathname === h || pathname.startsWith(h + '/'));
  const activeIdx = items.findIndex((it, i) => isActive(it.href, i));

  const target = (i: number, clientX?: number) => {
    const el = refs.current[i], w = wrap.current;
    if (!el || !w) return;
    const r = el.getBoundingClientRect(), wr = w.getBoundingClientRect();
    const dx = clientX == null ? 0 : Math.max(-6, Math.min(6, (clientX - (r.left + r.width / 2)) * 0.18));
    setPill({ x: r.left - wr.left, w: r.width, dx, on: true, i });
  };
  const rest = () => (activeIdx >= 0 ? target(activeIdx) : setPill((p) => ({ ...p, on: false })));
  useEffect(() => { rest(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pathname, items.length]);
  useEffect(() => { const f = () => rest(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeIdx]);

  return (
    <nav aria-label={label} className="hidden lg:block">
      <ul ref={wrap} onPointerLeave={rest} className="relative flex items-center">
        <motion.span aria-hidden className="absolute inset-y-0 rounded-full bg-brand" initial={false}
          animate={{ x: pill.x + pill.dx, width: pill.w, opacity: pill.on ? 1 : 0 }} transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.6 }} />
        {items.map((it, i) => (
          <li key={it.href} className="relative">
            <Link ref={(el) => { refs.current[i] = el; }} href={it.href}
              onPointerEnter={(e) => e.pointerType === 'mouse' && target(i, e.clientX)} onPointerMove={(e) => e.pointerType === 'mouse' && target(i, e.clientX)} onFocus={() => target(i)}
              aria-current={isActive(it.href, i) ? 'page' : undefined}
              className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors ${pill.on && pill.i === i ? 'text-brand-fg' : 'text-fg'}`}>
              <it.icon className="size-[0.95rem]" strokeWidth={1.6} aria-hidden />{it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Header() {
  const { t, settings, path, locale } = useSite();
  const { count } = useCart();
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const items: Item[] = [
    { href: path('/'), label: t.nav.home, icon: House },
    { href: path('/shop'), label: t.nav.shop, icon: Gem },
    { href: path('/about'), label: t.nav.about, icon: BookOpen },
    { href: path('/contact'), label: t.nav.contact, icon: Mail },
  ];

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-fg">{t.common.skipToContent}</a>
      <header className={`sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 ${pathname.replace(/\/$/, '') === path('/') ? 'home-header' : ''}`}>
        <div className={`glass mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full py-1.5 pl-3 pr-2 transition-all duration-500 sm:pl-5 ${scrolled ? 'shadow-xl' : ''}`}>
          <Link href={path('/')} aria-label={t.brand} className="group flex items-center gap-3 text-brand dark:text-accent">
            <LogoMark className="h-10 transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105 sm:h-11" />
            <span className="hidden font-display text-xl font-medium uppercase tracking-[0.12em] text-fg min-[420px]:block">Jawaher</span>
          </Link>

          <FloatingNav items={items} pathname={pathname} label={t.nav.main} />

          <div className="flex items-center gap-0.5">
            <LangSwitch />
            <ThemeToggle locale={locale} />
            <Link href={path('/cart')} aria-label={`${t.nav.cart}${count ? ` (${count})` : ''}`} className="relative grid size-11 place-items-center rounded-full transition hover:bg-accent/15 hover:text-accent">
              <ShoppingBag className="size-[1.15rem]" strokeWidth={1.5} />
              <AnimatePresence>
                {count > 0 && <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.62rem] font-semibold leading-4 text-[#2a1519]">{count}</motion.span>}
              </AnimatePresence>
            </Link>
            <button type="button" aria-label={open ? t.nav.closeMenu : t.nav.openMenu} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="grid size-11 place-items-center rounded-full transition hover:bg-accent/15 lg:hidden">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[55] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-[#12060a]/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.nav aria-label={t.nav.main} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 38 }}
              className="absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col gap-1 overflow-y-auto border-l border-line bg-bg px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24">
              {items.map((it, i) => (
                <motion.div key={it.href} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.06 }}>
                  <Link href={it.href} className={`flex items-center gap-4 border-b border-line py-4 font-display text-3xl ${pathname === it.href ? 'text-accent' : ''}`}>
                    <it.icon className="size-6 shrink-0 opacity-70" strokeWidth={1.4} aria-hidden />{it.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-auto pt-8"><SocialIcons links={settings.socials} className="text-fg" /></div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
