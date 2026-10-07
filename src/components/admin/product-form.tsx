'use client';
import { ADMIN_PATH } from '@/lib/admin-path';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import type { Language } from '@/lib/types';
import { saveProduct } from '@/app/(admin)/admin/actions/products';
import { Field, FormSection, Switch } from '@/components/ui/field';
import { Select } from '@/components/ui/floating';
import { useAdmin } from './shell';
import { firstText, useRun } from './bits';
import { FormPage } from './form-page';
import { ImageUpload } from './image-upload';
import { LangFields, LangLines, type FieldDef, type TrValue } from './lang-fields';

export type ProductInitial = {
  id?: string; category_id: string; slug: string; sku: string; price: string; compare_price: string; show_price: boolean; stock: number; track_stock: boolean;
  is_featured: boolean; is_new: boolean; is_active: boolean; weight: string; dimensions: string; sort_order: number;
  translations: TrValue;
  images: { id?: string; url: string; path: string | null; alt: Record<string, string> }[];
  sections: { id?: string; translations: TrValue }[];
};

const MAIN: FieldDef[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'short_description', label: 'Short description', kind: 'textarea', rows: 2, hint: 'One line shown on the product page under the name.' },
  { key: 'description', label: 'Description', kind: 'textarea', rows: 6 },
  { key: 'material', label: 'Material', placeholder: 'Gold vermeil' },
];
const SEO: FieldDef[] = [
  { key: 'seo_title', label: 'Search title', hint: 'Leave empty to use the name.' },
  { key: 'seo_description', label: 'Search description', kind: 'textarea', rows: 2, hint: 'Leave empty to use the short description.' },
];
const SECTION: FieldDef[] = [{ key: 'title', label: 'Title' }, { key: 'body', label: 'Text', kind: 'textarea', rows: 3 }];

export function ProductForm({ initial, languages, categories }: { initial: ProductInitial; languages: Language[]; categories: { id: string; name: string; active: boolean }[] }) {
  const router = useRouter();
  const { can } = useAdmin();
  const { run, pending } = useRun();
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isNew = !initial.id;
  const readOnly = !can(`products.${isNew ? 'add' : 'update'}`);
  const set = <K extends keyof ProductInitial>(k: K, v: ProductInitial[K]) => setF((x) => ({ ...x, [k]: v }));
  const txt = (k: 'slug' | 'sku' | 'price' | 'compare_price' | 'weight' | 'dimensions') => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value) });
  const setTr = (locale: string, field: string, v: string) => setF((x) => ({ ...x, translations: { ...x.translations, [locale]: { ...x.translations[locale], [field]: v } } }));
  const move = (i: number, d: number) => setF((x) => { const n = [...x.images]; const j = i + d; if (j < 0 || j >= n.length) return x; [n[i], n[j]] = [n[j], n[i]]; return { ...x, images: n }; });

  const submit = async () => {
    const payload = {
      ...f, category_id: f.category_id || null,
      images: f.images.map((im) => ({ id: im.id, url: im.url, path: im.path, translations: Object.fromEntries(languages.map((l) => [l.code, { alt_text: im.alt[l.code] ?? '' }])) })),
      sections: f.sections,
    };
    const name = firstText(f.translations, 'name');
    const label = name ? `“${name}”` : 'The product';
    const r = await run(() => saveProduct(payload), isNew
      ? { title: 'Product created', message: `${label} has been added to your catalogue.` }
      : { title: 'Changes saved', message: `${label} has been updated.` });
    if (r.ok) router.push(`${ADMIN_PATH}/products`);
    else setErrors(r.fieldErrors ?? {});
  };

  return (
    <FormPage title={isNew ? 'New product' : 'Edit product'} back={`${ADMIN_PATH}/products`} backLabel="All products" onSubmit={submit} pending={pending} readOnly={readOnly}>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid min-w-0 gap-6">
          <FormSection title="Wording" description="Write it in every language you want visitors to see. Only the main language is required; the others fall back to it.">
            <LangFields languages={languages} fields={MAIN} value={f.translations} onChange={setTr} errors={errors} />
          </FormSection>

          <FormSection title="Photos" description="The first photo is the main one. The second shows when someone hovers over the product in the shop.">
            {f.images.length > 0 && (
              <ul className="grid gap-3">
                {f.images.map((im, i) => (
                  <li key={im.id ?? im.url} className="flex flex-col gap-3 rounded-2xl border border-line p-2.5 sm:flex-row sm:items-center">
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-xl">
                      <Image src={im.url} alt="" fill sizes="96px" className="object-cover" onError={() => setErrors((e) => ({ ...e, images: 'A photo could not be loaded. Please remove it and upload it again.' }))} />
                      {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-brand/90 py-0.5 text-center text-[0.55rem] uppercase tracking-widest text-brand-fg">Main</span>}
                    </div>
                    <div className="min-w-0 flex-1"><LangLines languages={languages} placeholder="Describe the photo" value={im.alt} onChange={(l, v) => setF((x) => ({ ...x, images: x.images.map((m, k) => (k === i ? { ...m, alt: { ...m.alt, [l]: v } } : m)) }))} /></div>
                    <div className="flex gap-1 sm:flex-col">
                      <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-full p-2 hover:bg-accent/15 disabled:opacity-30"><ArrowUp className="size-4" /></button>
                      <button type="button" aria-label="Move down" disabled={i === f.images.length - 1} onClick={() => move(i, 1)} className="rounded-full p-2 hover:bg-accent/15 disabled:opacity-30"><ArrowDown className="size-4" /></button>
                      <button type="button" aria-label="Remove photo" onClick={() => setF((x) => ({ ...x, images: x.images.filter((_, k) => k !== i) }))} className="rounded-full p-2 text-danger hover:bg-danger/10"><X className="size-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <ImageUpload folder="products" multiple remaining={12 - f.images.length} label="Add photos" hint="You can pick several at once. JPG, PNG, WebP or AVIF, up to 8 MB each." onUploaded={(u) => { setErrors((e) => ({ ...e, images: '' })); setF((x) => (x.images.length >= 12 ? x : { ...x, images: [...x.images, { url: u.url, path: u.path, alt: {} }] })); }} />
            {errors.images && <p role="alert" className="text-sm text-danger">{errors.images}</p>}
            <p className="text-xs text-muted">Active products need at least one photo. Removals take effect when you save; Cancel keeps saved photos.</p>
          </FormSection>

          <FormSection title="Details">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Reference" placeholder="MJ-R-001" {...txt('sku')} />
              <Field label="Weight" placeholder="4 g" {...txt('weight')} />
              <Field label="Size" placeholder="Diameter 18 mm" {...txt('dimensions')} />
            </div>
          </FormSection>

          <FormSection title="Extra sections" description="Collapsible sections on the product page, for example care or delivery.">
            {f.sections.map((s, i) => (
              <div key={s.id ?? i} className="grid gap-3 rounded-2xl border border-line p-4">
                <LangFields compact languages={languages} fields={SECTION} value={s.translations}
                  onChange={(l, field, v) => setF((x) => ({ ...x, sections: x.sections.map((c, k) => (k === i ? { ...c, translations: { ...c.translations, [l]: { ...c.translations[l], [field]: v } } } : c)) }))} />
                <button type="button" onClick={() => setF((x) => ({ ...x, sections: x.sections.filter((_, k) => k !== i) }))} className="flex items-center gap-2 justify-self-end text-sm text-danger"><Trash2 className="size-4" />Remove this section</button>
              </div>
            ))}
            <button type="button" className="btn btn-outline justify-self-start" onClick={() => setF((x) => ({ ...x, sections: [...x.sections, { translations: Object.fromEntries(languages.map((l) => [l.code, { title: '', body: '' }])) }] }))}><Plus className="size-4" />Add a section</button>
          </FormSection>

          <FormSection title="Search engines" description="What Google shows for this product.">
            <LangFields languages={languages} fields={SEO} value={f.translations} onChange={setTr} errors={errors} />
            <Field label="Web address" hint="Part of the page link. Leave empty to make it from the name." {...txt('slug')} error={errors.slug} />
          </FormSection>
        </div>

        <aside className="grid h-fit min-w-0 gap-6 lg:sticky lg:top-24">
          <FormSection title="Visibility">
            <Switch label="Active" hint="Inactive products are hidden from the website." checked={f.is_active} onChange={(v) => set('is_active', v)} disabled={!can('products.toggle')} />
            <Switch label="Signature piece" hint="Shown in “Signature pieces” on the home page." checked={f.is_featured} onChange={(v) => set('is_featured', v)} />
            <Switch label="New arrival" hint="Shown in “New this season”." checked={f.is_new} onChange={(v) => set('is_new', v)} />
          </FormSection>
          <FormSection title="Category">
            <Select label="Category" value={f.category_id} onChange={(v) => set('category_id', v)} placeholder="No category" options={[{ value: '', label: 'No category' }, ...categories.map((c) => ({ value: c.id, label: c.active ? c.name : `${c.name} (off)` }))]} />
            {categories.find((c) => c.id === f.category_id && !c.active) && <p className="text-xs text-accent">This category is off, so the product stays hidden from the website.</p>}
            <Field label="Order" type="number" hint="Smaller numbers come first." value={f.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
          </FormSection>
          <FormSection title="Price">
            <Field label="Price" type="number" inputMode="decimal" min={0} step="0.01" {...txt('price')} error={errors.price} />
            <Field label="Old price" type="number" inputMode="decimal" min={0} step="0.01" hint="Shown crossed out next to the price." {...txt('compare_price')} error={errors.compare_price} />
            <Switch label="Show the price" hint="Off shows “Price on request”." checked={f.show_price} onChange={(v) => set('show_price', v)} />
          </FormSection>
          <FormSection title="Stock">
            <Switch label="Count stock" hint="Off means always available." checked={f.track_stock} onChange={(v) => set('track_stock', v)} />
            {f.track_stock && <Field label="Units in stock" type="number" min={0} value={f.stock} onChange={(e) => set('stock', Number(e.target.value))} />}
          </FormSection>
        </aside>
      </div>
    </FormPage>
  );
}
