'use client';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import { PageHeader } from './shell';

/** Standard layout for an edit page: back link, title, form, and a save bar that sticks to the bottom. */
export function FormPage({ title, description, back, backLabel, onSubmit, pending, readOnly, saveLabel = 'Save', children }: {
  title: string; description?: string; back: string; backLabel: string; onSubmit: () => void; pending: boolean; readOnly: boolean; saveLabel?: string; children: React.ReactNode;
}) {
  return (
    <form method="post" noValidate onSubmit={(e) => { e.preventDefault(); if (!readOnly) onSubmit(); }} className="pb-28">
      <Link href={back} className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"><ArrowLeft className="size-4" />{backLabel}</Link>
      <PageHeader title={title} description={description} />
      {readOnly && (
        <p className="mb-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm"><Eye className="size-5 shrink-0 text-accent" />You can look at this page but your role does not allow changes.</p>
      )}
      <fieldset disabled={readOnly || pending} className="min-w-0 border-0 p-0">{children}</fieldset>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/85 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:pl-[calc(5.25rem+1rem)]">
        <div className="mx-auto flex max-w-6xl justify-end gap-3 sm:px-4">
          <Link href={back} className="btn btn-outline">{readOnly ? 'Back' : 'Cancel'}</Link>
          {!readOnly && <button className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : saveLabel}</button>}
        </div>
      </div>
    </form>
  );
}
