'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Floating layer rendered in a portal at <body> level, so cards/overflow containers can never clip it.
 * Opens on hover (mouse, when `hover`) or tap/click (touch & keyboard). With a mouse it always closes shortly after the
 * pointer leaves both the trigger and the panel, so a menu never stays open behind you.
 */
export function FloatingMenu({
  trigger, children, align = 'end', width, hover = true, className = '',
}: {
  trigger: (p: { open: boolean; props: Record<string, unknown> }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end' | 'center';
  width?: number | 'trigger';
  hover?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 0, maxH: 400, up: false });
  const wrap = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = useId();
  useEffect(() => () => clearTimeout(timer.current), []);

  const place = useCallback(() => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    const pw = panel.current?.offsetWidth ?? (typeof width === 'number' ? width : 220);
    const ph = panel.current?.offsetHeight ?? 200;
    const below = window.innerHeight - r.bottom - 12;
    const up = below < Math.min(ph, 260) && r.top > below;
    let left = align === 'end' ? r.right - pw : align === 'center' ? r.left + r.width / 2 - pw / 2 : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    setPos({ top: up ? r.top - 8 : r.bottom + 8, left, minWidth: width === 'trigger' ? r.width : 0, maxH: Math.max(160, (up ? r.top : below) - 8), up });
  }, [align, width]);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);
  useEffect(() => {
    if (!open) return;
    const re = () => place();
    window.addEventListener('resize', re);
    window.addEventListener('scroll', re, true);
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!wrap.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    const raf = requestAnimationFrame(place);
    return () => { window.removeEventListener('resize', re); window.removeEventListener('scroll', re, true); document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); cancelAnimationFrame(raf); };
  }, [open, place]);

  // Entering keeps the menu open (cancels a pending close); only `hover` menus also open on enter.
  // A click on a menu that the mouse already opened by hovering keeps it open (instead of flipping it shut); the next click closes it
  const hovered = useRef(false);
  const click = () => {
    if (!open) { hovered.current = false; setOpen(true); }
    else if (hovered.current) hovered.current = false;
    else setOpen(false);
  };
  const enter = (e: React.PointerEvent) => { if (e.pointerType !== 'mouse') return; clearTimeout(timer.current); if (hover) { if (!open) hovered.current = true; setOpen(true); } };
  const leave = (e: React.PointerEvent) => { if (e.pointerType !== 'mouse') return; clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 220); };

  return (
    <span ref={wrap} className={`inline-flex ${className}`} onPointerEnter={enter} onPointerLeave={leave}>
      {trigger({ open, props: { 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': id, onClick: click } })}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div ref={panel} id={id} role="menu" onPointerEnter={enter} onPointerLeave={leave}
              initial={{ opacity: 0, y: pos.up ? 8 : -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              style={{ position: 'fixed', top: pos.up ? undefined : pos.top, bottom: pos.up ? window.innerHeight - pos.top : undefined, left: pos.left, minWidth: pos.minWidth, width: typeof width === 'number' ? width : undefined, maxHeight: pos.maxH, transformOrigin: pos.up ? 'bottom' : 'top' }}
              className="glass z-[120] overflow-y-auto rounded-2xl p-1.5">
              {children(() => setOpen(false))}
            </motion.div>
          )}
        </AnimatePresence>, document.body)}
    </span>
  );
}

export function MenuItem({ children, active, onClick, href, as: As = 'button' }: { children: ReactNode; active?: boolean; onClick?: () => void; href?: string; as?: 'button' | 'a' }) {
  const cls = `flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition hover:bg-accent/15 ${active ? 'text-accent' : ''}`;
  return As === 'a'
    ? <a role="menuitem" href={href} onClick={onClick} className={cls}>{children}{active && <Check className="size-4" />}</a>
    : <button type="button" role="menuitem" onClick={onClick} className={cls}>{children}{active && <Check className="size-4" />}</button>;
}

/** Form-friendly custom select (renders a hidden input so it works with FormData / server actions). */
export function Select({ name, value, onChange, options, label, hideLabel, placeholder = 'Select…', className = '' }: {
  hideLabel?: boolean; name?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label?: string; placeholder?: string; className?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <div className={className}>
      {label && <span className={hideLabel ? 'sr-only' : 'mb-1.5 block text-[0.8rem] font-medium tracking-wide'}>{label}</span>}
      {name && <input type="hidden" name={name} value={value} />}
      <FloatingMenu hover={false} align="start" width="trigger" className="w-full"
        trigger={({ open, props }) => (
          <button type="button" {...props} className="input flex items-center justify-between gap-2 text-left" aria-label={label}>
            <span className={current ? '' : 'text-muted'}>{current?.label ?? placeholder}</span>
            <ChevronDown className={`size-4 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
          </button>
        )}>
        {(close) => options.map((o) => <MenuItem key={o.value} active={o.value === value} onClick={() => { onChange(o.value); close(); }}>{o.label}</MenuItem>)}
      </FloatingMenu>
    </div>
  );
}
