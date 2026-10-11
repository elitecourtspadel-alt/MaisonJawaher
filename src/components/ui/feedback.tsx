'use client';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Check, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
export type ToastInput = {
  kind?: ToastKind; title: string; message?: string;
  /** A product photo (or similar) shown instead of the icon. */
  image?: string | null;
  /** One quiet button, for example "View cart". */
  action?: { label: string; href?: string; onClick?: () => void };
};
type ToastItem = ToastInput & { id: number; kind: ToastKind };
type ConfirmOpts = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };

type Ctx = {
  toast: (t: ToastInput) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
};
const FeedbackCtx = createContext<Ctx | null>(null);
export const useFeedback = () => {
  const c = useContext(FeedbackCtx);
  if (!c) throw new Error('FeedbackProvider missing');
  return c;
};

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const tone = { success: 'var(--ok)', error: 'var(--danger)', info: 'var(--accent)' };
const lifetime = (t: ToastItem) => (t.kind === 'error' ? 7000 : t.action ? 6000 : 4000);

/**
 * One notification: a calm card with a gold hairline, a round tinted icon (or the product photo), the message and an
 * optional action. It leaves by itself after a few seconds, and stays while the pointer is on it.
 */
function ToastCard({ t, onClose }: { t: ToastItem; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(lifetime(t));
  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const id = setTimeout(onClose, left.current);
    return () => { clearTimeout(id); left.current -= Date.now() - started; };
  }, [paused, onClose]);
  const Icon = icons[t.kind];
  const color = tone[t.kind];
  const act = t.action;
  const actCls = 'shrink-0 rounded-full border border-line px-3.5 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-accent transition hover:border-accent hover:bg-accent/10';

  return (
    <motion.div layout initial={{ opacity: 0, y: -20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      role={t.kind === 'error' ? 'alert' : 'status'}
      onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--glass-line)] bg-surface shadow-[0_28px_60px_-24px_rgba(60,10,20,0.5)]">
      <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div className="flex items-center gap-3.5 py-3.5 pl-3.5 pr-2.5">
        {t.image ? (
          <span className="relative size-12 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.image} alt="" className="size-12 rounded-xl border border-line object-cover" />
            <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full text-white ring-2 ring-[var(--surface)]" style={{ background: color }}><Check className="size-3" strokeWidth={3} /></span>
          </span>
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}><Icon className="size-5" style={{ color }} /></span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-medium leading-snug">{t.title}</p>
          {t.message && <p className="mt-0.5 break-words text-sm leading-snug text-muted">{t.message}</p>}
        </div>
        {act && (act.href
          ? <Link href={act.href} onClick={() => { act.onClick?.(); onClose(); }} className={actCls}>{act.label}</Link>
          : <button type="button" onClick={() => { act.onClick?.(); onClose(); }} className={actCls}>{act.label}</button>)}
        <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"><X className="size-4" /></button>
      </div>
    </motion.div>
  );
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const [mounted, setMounted] = useState(false);
  const seq = useRef(0);
  useEffect(() => setMounted(true), []);

  const toast = useCallback<Ctx['toast']>((input) => {
    const id = ++seq.current;
    // the same message twice in a row replaces itself instead of piling up
    setToasts((l) => [...l.filter((x) => !(x.title === input.title && x.message === input.message)).slice(-2), { ...input, kind: input.kind ?? 'info', id }]);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((l) => l.filter((t) => t.id !== id)), []);
  const confirm = useCallback<Ctx['confirm']>((o) => new Promise((resolve) => setDlg({ ...o, resolve })), []);
  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);
  const close = (v: boolean) => { dlg?.resolve(v); setDlg(null); };

  return (
    <FeedbackCtx.Provider value={value}>
      {children}
      {mounted && createPortal(
        <>
          <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-3 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+5.25rem)]">
            <AnimatePresence initial={false}>
              {toasts.map((t) => <ToastCard key={t.id} t={t} onClose={() => dismiss(t.id)} />)}
            </AnimatePresence>
          </div>
          <Modal open={!!dlg} onClose={() => close(false)} size="sm" title={dlg?.title}>
            {dlg && (
              <div>
                <div className="mb-4 flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: dlg.danger ? 'color-mix(in srgb, var(--danger) 14%, transparent)' : 'var(--accent-soft)' }}>
                    <AlertTriangle className="size-5" style={{ color: dlg.danger ? 'var(--danger)' : 'var(--accent)' }} />
                  </span>
                  {dlg.message && <p className="pt-1.5 text-sm text-muted">{dlg.message}</p>}
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button className="btn btn-outline" onClick={() => close(false)}>{dlg.cancelLabel ?? 'Cancel'}</button>
                  <button className={`btn ${dlg.danger ? '' : 'btn-primary'}`} style={dlg.danger ? { background: 'var(--danger)', color: '#fff' } : undefined} onClick={() => close(true)} autoFocus>{dlg.confirmLabel ?? 'Confirm'}</button>
                </div>
              </div>
            )}
          </Modal>
        </>, document.body)}
    </FeedbackCtx.Provider>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const [mounted, setMounted] = useState(false);
  const id = useId();
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!mounted) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size];
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] grid place-items-end sm:place-items-center">
          <motion.div className="absolute inset-0 bg-[#12060a]/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-labelledby={title ? id : undefined}
            initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={`relative max-h-[92dvh] w-full ${w} overflow-y-auto rounded-t-3xl border border-line bg-surface p-6 shadow-2xl sm:rounded-3xl sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]`}>
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
            <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-muted transition hover:bg-surface-2 hover:text-fg"><X className="size-5" /></button>
            {title && <h2 id={id} className="mb-4 pr-8 font-display text-2xl font-medium">{title}</h2>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>, document.body);
}
