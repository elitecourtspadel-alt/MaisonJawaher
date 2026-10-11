'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Product } from '@/lib/types';
import { loc } from '@/lib/i18n';
import { useCart, useSite } from '@/components/site-context';
import { useFeedback } from '@/components/ui/feedback';

export function ProductCard({ product: p, priority = false }: { product: Product; priority?: boolean }) {
  const { locale, t, settings, price, path } = useSite();
  const { add } = useCart();
  const { toast } = useFeedback();
  const imgs = p.product_images ?? [];
  const name = loc(p, 'name', locale);
  const showPrice = settings.show_prices && p.show_price && p.price != null;
  const soldOut = p.track_stock && p.stock <= 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add({ id: p.id, slug: p.slug, name, price: showPrice ? Number(p.price) : null, image: imgs[0]?.url ?? null });
    toast({ kind: 'success', title: t.product.added, message: name, image: imgs[0]?.url ?? null, action: { label: t.product.viewCart, href: path('/cart') } });
  };

  return (
    <article className="card card-hover group relative overflow-hidden">
      <Link href={path(`/product/${p.slug}`)} className="block" aria-label={name}>
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
          {imgs[0] ? (
            <>
              <Image src={imgs[0].url} alt={loc(imgs[0], 'alt_text', locale) || name} fill priority={priority} sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                className={`object-cover transition duration-700 ${imgs[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`} />
              {imgs[1] && <Image src={imgs[1].url} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover opacity-0 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />}
            </>
          ) : (
            <div className="grid size-full place-items-center text-accent/60"><svg viewBox="0 0 100 100" width="56" height="56" aria-hidden><circle cx="50" cy="56" r="20" fill="none" stroke="currentColor" strokeWidth="1.4" /><circle cx="50" cy="30" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg></div>
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {p.is_new && <span className="rounded-full bg-brand px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-brand-fg">{t.common.new}</span>}
            {soldOut && <span className="rounded-full bg-surface/90 px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em]">{t.common.outOfStock}</span>}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-[0.66rem] uppercase tracking-[0.22em] text-accent">{p.categories ? loc(p.categories, 'name', locale) : ''}</p>
          <h3 className="mt-1.5 font-display text-xl leading-tight sm:text-2xl">{name}</h3>
          <p className="mt-2 flex items-baseline gap-2 text-sm">
            {showPrice ? (
              <>
                <span className="font-medium">{price(p.price)}</span>
                {p.compare_price && p.compare_price > (p.price ?? 0) && <s className="text-xs text-muted">{price(p.compare_price)}</s>}
              </>
            ) : <span className="text-muted">{settings.show_prices ? t.common.priceOnRequest : ''}</span>}
          </p>
        </div>
      </Link>
      {!soldOut && (
        <button type="button" onClick={quickAdd} aria-label={`${t.product.addToCart}: ${name}`}
          className="absolute bottom-4 right-4 grid size-11 place-items-center rounded-full bg-brand text-brand-fg shadow-lg transition hover:scale-110 hover:bg-brand-2 active:scale-95 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100">
          <Plus className="size-5" />
        </button>
      )}
    </article>
  );
}
