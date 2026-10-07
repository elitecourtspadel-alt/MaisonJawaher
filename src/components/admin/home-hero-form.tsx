'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { saveSettings } from '@/app/(admin)/admin/actions/settings';
import { PageHeader, useAdmin } from './shell';
import { useRun } from './bits';
import { FormSection } from '@/components/ui/field';
import { ImageUpload } from './image-upload';

export function HomeHeroForm({ settings }: { settings: SiteSettings }) {
  const { can } = useAdmin();
  const readOnly = !can('settings.update');
  const [photo, setPhoto] = useState({ url: settings.hero_background_url, path: settings.hero_background_path });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, pending } = useRun();
  const save = async () => {
    const result = await run(() => saveSettings({ hero_background_url: photo.url, hero_background_path: photo.path }), { title: 'Home hero saved', message: 'Your background photo is now live on the website.' });
    setErrors(result.ok ? {} : result.fieldErrors ?? {});
  };
  return <>
    <PageHeader title="Home hero" description="The background behind your home-page logo, headline and buttons." />
    {readOnly && <p className="mb-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm"><Eye className="size-5 shrink-0 text-accent" />You can view the hero, but your role does not allow changes.</p>}
    <fieldset disabled={readOnly || pending} className="grid min-w-0 gap-6 border-0 p-0">
      <FormSection title="Hero background photo" description="Optional photo behind the existing home-page logo, headline and buttons. A burgundy overlay keeps the wording readable. Wide landscape images work best, around 2400 pixels wide.">
        {photo.url && <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-2"><Image src={photo.url} alt="Home hero background preview" fill sizes="(min-width: 768px) 70vw, 100vw" className="object-cover" /></div>}
        <ImageUpload folder="settings" label={photo.url ? 'Replace background photo' : 'Add background photo'} onUploaded={(upload) => { setPhoto(upload); setErrors({}); }} />
        {photo.url && <button type="button" className="btn btn-outline justify-self-start" onClick={() => { setPhoto({ url: '', path: '' }); setErrors({}); }}>Remove background photo</button>}
        {(errors.hero_background_url || errors.hero_background_path) && <p role="alert" className="text-sm text-danger">{errors.hero_background_url || errors.hero_background_path}</p>}
        <p className="text-xs leading-6 text-muted">Save changes to publish the photo or its removal. Without a photo, the original burgundy background is shown. The logo and wording stay the same.</p>
      </FormSection>
      {!readOnly && <div className="flex justify-end"><button type="button" className="btn btn-primary" disabled={pending} onClick={save}>{pending ? 'Saving…' : 'Save changes'}</button></div>}
    </fieldset>
  </>;
}
