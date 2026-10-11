'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Result } from '@/lib/admin/result';
import { useState } from 'react';
import { useFeedback } from '@/components/ui/feedback';
import { PageHeader, useAdmin } from './shell';
import { ActiveSwitch, EmptyState, useRun } from './bits';
import { Pagination, paginate } from './pagination';

const PER_PAGE = 12;

export type ListItem = {
  id: string; title: string; subtitle?: string; image?: string | null; active: boolean; order?: number;
  /** When set the item cannot be deleted and this is why. */
  lockedReason?: string;
  /** Asked before turning the item off. */
  offWarning?: string;
};

/** One list screen for categories, slides, FAQs and announcements: toggle, edit (opens a page) and delete. */
export function SimpleList({ module, base, noun, plural, title, description, items, emptyText, toggle, remove }: {
  module: string; base: string; noun: string; plural: string; title: string; description: string; items: ListItem[]; emptyText: string;
  toggle: (id: string, active: boolean) => Promise<Result>; remove: (id: string) => Promise<Result>;
}) {
  const { can } = useAdmin();
  const { run } = useRun();
  const { confirm, toast } = useFeedback();
  const [page, setPage] = useState(1);
  const current = Math.min(page, Math.max(1, Math.ceil(items.length / PER_PAGE))); // stays valid after a delete

  const onToggle = async (it: ListItem, next: boolean) => {
    if (!next && it.offWarning && !(await confirm({ title: `Turn off “${it.title}”?`, message: it.offWarning, confirmLabel: 'Turn off' }))) return;
    run(() => toggle(it.id, next), next
      ? { title: 'Turned on', message: `“${it.title}” is now visible on the website.` }
      : { title: 'Turned off', message: `“${it.title}” is now hidden from the website.` });
  };
  const onDelete = async (it: ListItem) => {
    if (await confirm({ title: `Delete “${it.title}”?`, message: `This ${noun} will be removed for good.`, danger: true, confirmLabel: 'Delete' })) run(() => remove(it.id), { title: 'Deleted', message: `“${it.title}” has been removed.` });
  };

  return (
    <>
      <PageHeader title={title} description={description}>
        {can(`${module}.add`) && <Link href={`${base}/new`} className="btn btn-primary"><Plus className="size-4" />New {noun}</Link>}
      </PageHeader>
      {!items.length ? <EmptyState><p>{emptyText}</p></EmptyState> : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={plural}>
          {paginate(items, current, PER_PAGE).map((it) => (
            <li key={it.id} className="card flex items-center gap-3 p-3">
              {it.image !== undefined && (
                <Link href={`${base}/${it.id}`} aria-label={`Open ${it.title}`} className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {it.image && <Image src={it.image} alt="" fill sizes="64px" className="object-cover" />}
                </Link>
              )}
              <div className="min-w-0 flex-1">
                <Link href={`${base}/${it.id}`} className="block truncate font-display text-xl leading-tight hover:text-accent">{it.title || `(untitled ${noun})`}</Link>
                {it.subtitle && <p className="truncate text-xs text-muted">{it.subtitle}</p>}
                <div className="mt-2 flex items-center gap-2"><ActiveSwitch on={it.active} disabled={!can(`${module}.toggle`)} label={`${it.title}: ${it.active ? 'active' : 'inactive'}`} onChange={(v) => onToggle(it, v)} /><span className="text-xs text-muted">{it.active ? 'Active' : 'Inactive'}</span></div>
              </div>
              <div className="flex flex-col gap-1">
                <Link aria-label={can(`${module}.update`) ? `Edit ${it.title}` : `View ${it.title}`} href={`${base}/${it.id}`} className="rounded-full p-2 hover:bg-accent/15"><Pencil className="size-4" /></Link>
                {can(`${module}.delete`) && (it.lockedReason
                  ? <button aria-label={`Cannot delete: ${it.lockedReason}`} title={it.lockedReason} className="cursor-not-allowed rounded-full p-2 text-muted opacity-60" onClick={() => toast({ kind: 'error', title: 'This cannot be deleted yet', message: it.lockedReason })}><Lock className="size-4" /></button>
                  : <button aria-label={`Delete ${it.title}`} onClick={() => onDelete(it)} className="rounded-full p-2 text-danger hover:bg-danger/10"><Trash2 className="size-4" /></button>)}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={current} perPage={PER_PAGE} total={items.length} onPage={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }} noun={plural} />
    </>
  );
}
