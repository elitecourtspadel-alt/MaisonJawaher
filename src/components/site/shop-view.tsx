'use client';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Search } from 'lucide-react';
import type { Category, Product } from '@/lib/types';
import { loc } from '@/lib/i18n';
import { useSite } from '@/components/site-context';
import { SlideTabs } from '@/components/ui/slide-tabs';
import { Select } from '@/components/ui/floating';
import { ProductCard } from './product-card';

export function ShopView({ products, categories }: { products: Product[]; categories: Category[] }) {
  const { t, locale, settings } = useSite();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get('category');
  const current = categories.find((c) => c.slug === requested);
  const cat = current?.slug ?? 'all';
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = products.filter((p) => (cat === 'all' || p.categories?.slug === cat) &&
      (!needle || `${p.translations.map((x) => `${x.name ?? ''} ${x.material ?? ''}`).join(' ')} ${p.sku}`.toLowerCase().includes(needle)));
    const price = (p: Product) => p.price ?? Infinity;
    if (sort === 'asc') out = [...out].sort((a, b) => price(a) - price(b));
    if (sort === 'desc') out = [...out].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === 'name') out = [...out].sort((a, b) => loc(a, 'name', locale).localeCompare(loc(b, 'name', locale), locale));
    return out;
  }, [products, cat, q, sort, locale]);

  const changeCat = (v: string) => {
    const u = new URL(window.location.href);
    v === 'all' ? u.searchParams.delete('category') : u.searchParams.set('category', v);
    router.push(`${u.pathname}${u.search}${u.hash}`, { scroll: false });
  };
  const sortOpts = [{ value: 'new', label: t.shop.sortNew }, ...(settings.show_prices ? [{ value: 'asc', label: t.shop.sortPriceAsc }, { value: 'desc', label: t.shop.sortPriceDesc }] : []), { value: 'name', label: t.shop.sortName }];

  return (
    <>
      <header className="mb-10">
        <p className="eyebrow">Maison Jawaher</p>
        <h1 className="section-title mt-3">{current ? loc(current, 'name', locale) : t.shop.title}</h1>
        <p className="mt-3 max-w-xl text-muted">{(current && loc(current, 'description', locale)) || t.shop.subtitle}</p>
      </header>
      <div className="mb-10 flex flex-col items-start gap-5">
        <SlideTabs controls label={t.nav.collections} value={cat} onChange={changeCat} tabs={[{ value: 'all', label: t.shop.all }, ...categories.map((c) => ({ value: c.slug, label: loc(c, 'name', locale) }))]} />
        <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-[1fr_13rem]">
          <label className="relative block">
            <span className="sr-only">{t.common.search}</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.shop.searchPlaceholder} className="input pl-11" />
          </label>
          <Select value={sort} onChange={setSort} options={sortOpts} label={t.shop.sort} hideLabel />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted" aria-live="polite">{t.shop.results.replace('{n}', String(list.length))}</p>
      </div>

      {list.length === 0 ? (
        <p className="py-20 text-center text-muted">{t.shop.empty}</p>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.03 }}>
                <ProductCard product={p} priority={i < 4} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
