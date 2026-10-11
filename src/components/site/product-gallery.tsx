'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import type { ProductImage } from '@/lib/types';
import { loc } from '@/lib/i18n';
import { useSite } from '@/components/site-context';

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const { locale, t } = useSite();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const image = images[index];
  const go = (step: number) => { setZoom(false); setIndex((i) => (i + step + images.length) % images.length); };
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, [open]);
  return <>
    <div>
      <div className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-3xl border border-line bg-surface-2"
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches || !image) return;
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); setZoom(true);
        }} onPointerLeave={() => setZoom(false)}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={index} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            drag={images.length > 1 && !zoom ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
            onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 60) go(info.offset.x < 0 ? 1 : -1); }}>
            {image ? <Image src={image.url} alt={loc(image, 'alt_text', locale) || name} fill priority sizes="(min-width: 1024px) 40vw, 100vw" draggable={false}
              className="select-none object-contain transition-transform duration-150" style={{ transform: zoom ? 'scale(2)' : 'scale(1)', transformOrigin: origin }} />
              : <div className="grid size-full place-items-center text-accent/50">◇</div>}
          </motion.div>
        </AnimatePresence>
        {image && <button type="button" aria-label={t.product.zoom} className="absolute bottom-4 right-4 grid size-11 place-items-center rounded-full border border-line bg-surface text-fg shadow" onClick={() => { setZoom(false); setOpen(true); }}><ZoomIn className="size-5" /></button>}
      </div>
      {images.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
        {images.map((im, i) => <button type="button" key={im.id} aria-label={`${t.product.zoom} ${i + 1}`} aria-current={i === index} onClick={() => { setIndex(i); setZoom(false); }} className={`relative aspect-square overflow-hidden rounded-xl border-2 ${i === index ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'}`}>
          <Image src={im.url} alt="" fill sizes="96px" className="object-contain" />
        </button>)}
      </div>}
    </div>
    {open && image && <dialog ref={dialog} aria-label={`${t.product.zoom}: ${name}`} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} onKeyDown={(e) => { if (images.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); go(e.key === 'ArrowLeft' ? -1 : 1); } }}
      className="fixed inset-0 m-auto max-h-[95svh] w-[min(96vw,80rem)] max-w-none overflow-hidden rounded-2xl border border-line bg-surface p-4 text-fg backdrop:bg-black/80">
      <div className="flex items-center justify-between gap-4 pb-3"><p className="font-display text-xl">{name}</p><button type="button" autoFocus className="grid size-11 place-items-center rounded-full border border-line" aria-label={t.product.closeZoom} onClick={() => setOpen(false)}><X className="size-5" /></button></div>
      <div className="relative h-[72svh]">
        <Image src={image.url} alt={loc(image, 'alt_text', locale) || name} fill sizes="96vw" className="object-contain" />
        {images.length > 1 && <><button type="button" aria-label={t.common.previous} onClick={() => go(-1)} className="absolute left-0 top-1/2 grid size-11 place-items-center rounded-full border border-line bg-surface"><ChevronLeft /></button><button type="button" aria-label={t.common.next} onClick={() => go(1)} className="absolute right-0 top-1/2 grid size-11 place-items-center rounded-full border border-line bg-surface"><ChevronRight /></button></>}
      </div>
      <p className="pt-2 text-center text-sm text-muted">{index + 1} / {images.length}</p>
    </dialog>}
  </>;
}
