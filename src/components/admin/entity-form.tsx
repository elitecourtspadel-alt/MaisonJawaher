'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import type { Language } from '@/lib/types';
import type { Result } from '@/lib/admin/result';
import { Field, FormSection, Switch } from '@/components/ui/field';
import { useAdmin } from './shell';
import { firstText, useRun } from './bits';
import { FormPage } from './form-page';
import { ImageUpload } from './image-upload';
import { LangFields, type FieldDef, type TrValue } from './lang-fields';

export type EntityInitial = {
  id?: string; slug?: string; image_url?: string | null; image_path?: string | null; cta_url?: string;
  sort_order: number; is_active: boolean; translations: TrValue;
};

/**
 * The edit page for categories, slides, FAQs and announcements. Saving returns to the list.
 * Which extra fields show (photo, web address, button link) depends on what the item has.
 */
export function EntityForm({ module, base, noun, plural, languages, initial, fields, seoFields, imageFolder, hasSlug, hasLink, save, imageRequired }: {
  module: string; base: string; noun: string; plural: string; languages: Language[]; initial: EntityInitial; fields: FieldDef[]; seoFields?: FieldDef[];
  imageFolder?: 'categories' | 'slides'; hasSlug?: boolean; hasLink?: boolean; imageRequired?: boolean;
  save: (input: unknown) => Promise<Result<{ id: string }>>;
}) {
  const router = useRouter();
  const { can } = useAdmin();
  const { run, pending } = useRun();
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isNew = !initial.id;
  const readOnly = !can(`${module}.${isNew ? 'add' : 'update'}`);
  const set = <K extends keyof EntityInitial>(k: K, v: EntityInitial[K]) => setF((x) => ({ ...x, [k]: v }));
  const setTr = (locale: string, field: string, v: string) => setF((x) => ({ ...x, translations: { ...x.translations, [locale]: { ...x.translations[locale], [field]: v } } }));

  const submit = async () => {
    const name = firstText(f.translations, fields[0]?.key ?? 'name');
    const label = name ? `“${name}”` : `The ${noun}`;
    const r = await run(() => save(f), isNew
      ? { title: `${noun[0].toUpperCase() + noun.slice(1)} created`, message: `${label} has been added.` }
      : { title: 'Changes saved', message: `${label} has been updated.` });
    if (r.ok) router.push(base);
    else setErrors(r.fieldErrors ?? {});
  };

  return (
    <FormPage title={isNew ? `New ${noun}` : `Edit ${noun}`} back={base} backLabel={`All ${plural}`} onSubmit={submit} pending={pending} readOnly={readOnly}>
      <div className="grid gap-6">
        <FormSection title="Wording" description="Write it in every language you want visitors to see. Only the main language is required; the others fall back to it.">
          <LangFields languages={languages} fields={fields} value={f.translations} onChange={setTr} errors={errors} />
        </FormSection>

        {imageFolder && (
          <FormSection title="Photo" description={imageRequired ? 'The complete photo fits a fixed-height slider without cropping. Background space may appear around it. Landscape photos around 2400 pixels wide look sharpest on desktop. Leave space at the bottom left for the caption; on mobile the caption appears below the photo.' : 'Required for active categories. You can save an inactive draft without a photo.'}>
            {f.image_url && (
              <div className="relative aspect-[16/9] max-w-xl overflow-hidden rounded-2xl">
                <Image src={f.image_url} alt="" fill sizes="600px" className="object-contain" onError={() => setErrors((e) => ({ ...e, image_url: 'This photo could not be loaded. Please replace it.' }))} />
                {!readOnly && <button type="button" aria-label="Remove the photo" onClick={() => setF((x) => ({ ...x, image_url: null, image_path: null }))} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white"><X className="size-4" /></button>}
              </div>
            )}
            {!readOnly && <ImageUpload folder={imageFolder} label={f.image_url ? 'Replace the photo' : 'Add a photo'} onUploaded={(u) => { setErrors((e) => ({ ...e, image_url: '' })); setF((x) => ({ ...x, image_url: u.url, image_path: u.path })); }} />}
            {errors.image_url && <p role="alert" className="text-[0.8rem] text-danger">{errors.image_url}</p>}
            <p className="text-xs text-muted">Removing or replacing a saved photo takes effect when you save. Cancel keeps the saved photo.</p>
          </FormSection>
        )}

        {(hasSlug || hasLink) && (
          <FormSection title="Link">
            {hasSlug && <Field label="Web address" hint="Part of the page link, for example “rings”. Leave empty to make it from the name." value={f.slug ?? ''} onChange={(e) => set('slug', e.target.value)} error={errors.slug} />}
            {hasLink && <Field label="Button link" hint="A page on this site such as /shop?category=rings, or a full link starting with https://" value={f.cta_url ?? ''} onChange={(e) => set('cta_url', e.target.value)} error={errors.cta_url} />}
          </FormSection>
        )}

        {seoFields && (
          <FormSection title="Search engines" description="What Google shows for this page. Leave empty to use the name and description.">
            <LangFields languages={languages} fields={seoFields} value={f.translations} onChange={setTr} errors={errors} />
          </FormSection>
        )}

        <FormSection title="Display">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Order" type="number" hint="Smaller numbers come first." value={f.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
            <Switch label="Active" hint="Inactive items are hidden from the website." checked={f.is_active} onChange={(v) => set('is_active', v)} disabled={!can(`${module}.toggle`)} />
          </div>
        </FormSection>
      </div>
    </FormPage>
  );
}
