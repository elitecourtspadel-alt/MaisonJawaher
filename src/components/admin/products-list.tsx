'use client';
import { ADMIN_PATH } from '@/lib/admin-path';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EyeOff, Pencil, Plus, Search, Sparkles, Star, Trash2 } from 'lucide-react';
import { deleteProduct, toggleProduct } from '@/app/(admin)/admin/actions/products';
import { useFeedback } from '@/components/ui/feedback';
import { PageHeader, useAdmin } from './shell';
import { ActiveSwitch, EmptyState, useRun } from './bits';
import { Pagination, paginate } from './pagination';

const PER_PAGE = 10;

export type ProductRow = { id: string; name: string; image: string | null; category: string; categoryOff: boolean; sku: string; price: number | null; showPrice: boolean; active: boolean; featured: boolean; isNew: boolean };

export function ProductsList({ products, currency }: { products: ProductRow[]; currency: string }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { can } = useAdmin();
  const { run } = useRun();
  const { confirm } = useFeedback();
  const list = useMemo(() => products.filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q.toLowerCase())), [products, q]);
  const lastPage = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, lastPage); // stays valid after a delete or a new search
  const shown = paginate(list, current, PER_PAGE);

  return (
    <>
      <PageHeader title="Products" description={`${products.length} in your catalogue.`}>
        {can('products.add') && <Link href={`${ADMIN_PATH}/products/new`} className="btn btn-primary"><Plus className="size-4" />New product</Link>}
      </PageHeader>
      <label className="relative mb-5 block max-w-md">
        <span className="sr-only">Search products</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input type="search" className="input pl-11" placeholder="Search by name, reference or category" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </label>
      {!list.length ? <EmptyState><p>{products.length ? 'Nothing matches your search.' : 'No products yet. Add your first one.'}</p></EmptyState> : (
        <ul className="grid gap-3">
          {shown.map((p) => (
            <li key={p.id} className="card flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap">
              <Link href={`${ADMIN_PATH}/products/${p.id}`} aria-label={`Open ${p.name}`} className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">{p.image && <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />}</Link>
              <div className="min-w-0 flex-1 basis-40">
                <Link href={`${ADMIN_PATH}/products/${p.id}`} className="block truncate font-display text-xl hover:text-accent">{p.name}</Link>
                <p className="truncate text-xs text-muted">{p.category || 'No category'}{p.sku && ` · ${p.sku}`} · {p.price != null ? `${p.price} ${currency}` : 'no price'}{!p.showPrice && ' (price hidden)'}</p>
                {p.categoryOff && <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-[0.7rem] text-accent"><EyeOff className="size-3" />Hidden from the website because its category is off</p>}
              </div>
              <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto">
                <ActiveSwitch on={p.active} disabled={!can('products.toggle')} label={`${p.name}: ${p.active ? 'active' : 'inactive'}`} onChange={(v) => run(() => toggleProduct(p.id, 'is_active', v), v
                  ? { title: 'Turned on', message: `“${p.name}” is now visible on the website.` }
                  : { title: 'Turned off', message: `“${p.name}” is now hidden from the website.` })} />
                <button aria-label={p.featured ? 'Remove from signature pieces' : 'Add to signature pieces'} aria-pressed={p.featured} disabled={!can('products.update')} onClick={() => run(() => toggleProduct(p.id, 'is_featured', !p.featured), { title: p.featured ? 'Removed from signature pieces' : 'Added to signature pieces', message: `“${p.name}” ${p.featured ? 'no longer appears' : 'now appears'} in “Signature pieces” on the home page.` })} className={`rounded-full p-2 transition hover:bg-accent/15 disabled:opacity-40 ${p.featured ? 'text-accent' : 'text-muted'}`}><Star className="size-4" fill={p.featured ? 'currentColor' : 'none'} /></button>
                <button aria-label={p.isNew ? 'Remove from new arrivals' : 'Add to new arrivals'} aria-pressed={p.isNew} disabled={!can('products.update')} onClick={() => run(() => toggleProduct(p.id, 'is_new', !p.isNew), { title: p.isNew ? 'Removed from new arrivals' : 'Added to new arrivals', message: `“${p.name}” ${p.isNew ? 'no longer appears' : 'now appears'} in “New this season”.` })} className={`rounded-full p-2 transition hover:bg-accent/15 disabled:opacity-40 ${p.isNew ? 'text-accent' : 'text-muted'}`}><Sparkles className="size-4" fill={p.isNew ? 'currentColor' : 'none'} /></button>
                <Link aria-label={can('products.update') ? `Edit ${p.name}` : `View ${p.name}`} href={`${ADMIN_PATH}/products/${p.id}`} className="rounded-full p-2 hover:bg-accent/15"><Pencil className="size-4" /></Link>
                {can('products.delete') && <button aria-label={`Delete ${p.name}`} onClick={async () => { if (await confirm({ title: `Delete “${p.name}”?`, message: 'The product and its photos will be removed for good.', danger: true, confirmLabel: 'Delete' })) run(() => deleteProduct(p.id), { title: 'Deleted', message: `“${p.name}” and its photos have been removed.` }); }} className="rounded-full p-2 text-danger hover:bg-danger/10"><Trash2 className="size-4" /></button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={current} perPage={PER_PAGE} total={list.length} onPage={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }} noun="products" />
    </>
  );
}
