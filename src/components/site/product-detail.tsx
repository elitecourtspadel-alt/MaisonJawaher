'use client';
import { useState } from 'react';
import { ProductGallery } from './product-gallery';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import type { Product } from '@/lib/types';
import { loc } from '@/lib/i18n';
import { useCart, useSite } from '@/components/site-context';
import { useFeedback } from '@/components/ui/feedback';
import { Accordion } from '@/components/ui/accordion';
import { JumpLinks } from '@/components/ui/jump-links';

export function ProductDetail({ product: p, hasRelated, crumbs = [], children }: { product: Product; hasRelated: boolean; crumbs?: { name: string; href: string }[]; children?: React.ReactNode }) {
  const { locale, t, settings, price, path } = useSite();
  const { add } = useCart();
  const { toast } = useFeedback();
  const imgs = p.product_images ?? [];
  const [qty, setQty] = useState(1);
  const name = loc(p, 'name', locale);
  const showPrice = settings.show_prices && p.show_price && p.price != null;
  const soldOut = p.track_stock && p.stock <= 0;
  const desc = loc(p, 'description', locale);

  const wa = `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(`${t.cart.whatsappIntro}\n• ${name} ×${qty}${showPrice ? ` — ${price(p.price)}` : ''}\n${typeof window !== 'undefined' ? window.location.href : ''}`)}`;

  const sections = [
    ...(loc(p, 'material', locale) || p.weight || p.dimensions || p.sku ? [{
      id: 'specs', title: t.product.details,
      content: (
        <dl className="grid gap-2">
          {([[t.product.material, loc(p, 'material', locale)], [t.product.weight, p.weight], [t.product.dimensions, p.dimensions], [t.product.sku, p.sku]] as const).filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 border-b border-line/60 pb-2 last:border-0"><dt>{k}</dt><dd className="text-right text-fg">{v}</dd></div>
          ))}
        </dl>
      ),
    }] : []),
    ...(p.product_sections ?? []).map((s, i) => ({ id: `s${i}`, title: loc(s, 'title', locale), content: loc(s, 'body', locale) })),
  ];

  const jumps = [{ id: 'overview', label: name }, ...(sections.length ? [{ id: 'details', label: t.product.details }] : []), ...(hasRelated ? [{ id: 'related', label: t.product.related }] : [])];

  return (
    <div className="container-x py-8 sm:py-14">
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="opacity-40">/</span>}
                {i === crumbs.length - 1 ? <span aria-current="page" className="text-fg">{c.name}</span> : <a href={c.href} className="transition hover:text-accent">{c.name}</a>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="grid gap-8 lg:grid-cols-[12rem_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-28 lg:self-start"><JumpLinks items={jumps} label={t.common.onThisPage} /></aside>
        <div>
          <div id="overview" className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {/* gallery */}
            <ProductGallery images={imgs} name={name} />

            {/* info */}
            <div>
              {p.categories && <p className="eyebrow">{loc(p.categories, 'name', locale)}</p>}
              <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {showPrice ? (
                  <>
                    <span className="text-2xl font-medium">{price(p.price)}</span>
                    {p.compare_price && p.compare_price > (p.price ?? 0) && <s className="text-muted">{price(p.compare_price)}</s>}
                  </>
                ) : settings.show_prices ? <span className="text-muted">{t.common.priceOnRequest}</span> : null}
                <span className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] ${soldOut ? 'border-danger text-danger' : 'border-ok text-ok'}`}>{soldOut ? t.common.outOfStock : t.common.inStock}</span>
              </div>
              {loc(p, 'short_description', locale) && <p className="mt-5 text-lg text-muted">{loc(p, 'short_description', locale)}</p>}

              {!soldOut && (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-full border border-line" role="group" aria-label={t.product.quantity}>
                    <button aria-label="−" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center rounded-full hover:text-accent"><Minus className="size-4" /></button>
                    <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
                    <button aria-label="+" onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid size-11 place-items-center rounded-full hover:text-accent"><Plus className="size-4" /></button>
                  </div>
                  <button className="btn btn-primary flex-1 sm:flex-none" onClick={() => { add({ id: p.id, slug: p.slug, name, price: showPrice ? Number(p.price) : null, image: imgs[0]?.url ?? null }, qty); toast({ kind: 'success', title: t.product.added, message: qty > 1 ? `${name} × ${qty}` : name, image: imgs[0]?.url ?? null, action: { label: t.product.viewCart, href: path('/cart') } }); }}>
                    <ShoppingBag className="size-4" />{t.product.addToCart}
                  </button>
                </div>
              )}
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-3 w-full sm:w-auto"><FaWhatsapp className="size-4 text-[#25d366]" />{showPrice || !settings.show_prices ? t.product.orderWhatsApp : t.product.askPrice}</a>

              {desc && <div className="mt-8 whitespace-pre-line leading-relaxed text-muted">{desc}</div>}
            </div>
          </div>

          {sections.length > 0 && (
            <section id="details" className="mt-14 sm:mt-20">
              <h2 className="section-title mb-6 !text-3xl">{t.product.details}</h2>
              <Accordion items={sections} defaultOpen={[sections[0].id]} numbered />
            </section>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
