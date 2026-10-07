'use client';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Page numbers around the current one, with gaps shown as "…": 1 … 4 5 [6] 7 8 … 20 */
export function pageList(page: number, pages: number): (number | '…')[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  sorted.forEach((n, i) => { if (i && n - sorted[i - 1] > 1) out.push('…'); out.push(n); });
  return out;
}

/**
 * Numbered pagination for the portal. Give it `basePath` (plus any other query values in `query`) for pages that live in
 * the address (server pages), or `onPage` for lists that are paged in the browser. Always shows the range; the page buttons are disabled when everything fits on one page.
 */
export function Pagination({ page, perPage, total, basePath, query = {}, onPage, noun = 'items' }: {
  page: number; perPage: number; total: number; noun?: string;
  basePath?: string; query?: Record<string, string>; onPage?: (n: number) => void;
}) {
  const href = basePath ? (n: number) => `${basePath}?${new URLSearchParams({ ...query, page: String(n) })}` : undefined;
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (total <= 0) return null;
  const from = (page - 1) * perPage + 1, to = Math.min(total, page * perPage);

  const item = (n: number, content: React.ReactNode, label: string, disabled = false, current = false) => {
    const cls = `grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm tabular-nums transition ${current ? 'bg-brand text-brand-fg' : 'hover:bg-accent/15'} ${disabled ? 'pointer-events-none opacity-35' : ''}`;
    return href && !disabled
      ? <Link key={label} href={href(n)} scroll aria-label={label} aria-current={current ? 'page' : undefined} className={cls}>{content}</Link>
      : <button key={label} type="button" disabled={disabled} aria-label={label} aria-current={current ? 'page' : undefined} onClick={() => onPage?.(n)} className={cls}>{content}</button>;
  };

  return (
    <nav aria-label="Pages" className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-muted">Showing {from}–{to} of {total} {noun}</p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {item(page - 1, <ChevronLeft className="size-4" />, 'Previous page', page <= 1)}
        {pageList(page, pages).map((n, i) => n === '…' ? <span key={`gap${i}`} aria-hidden className="px-1 text-muted">…</span> : item(n, n, `Page ${n}`, false, n === page))}
        {item(page + 1, <ChevronRight className="size-4" />, 'Next page', page >= pages)}
      </div>
    </nav>
  );
}

/** Slice helper for lists paged in the browser. */
export const paginate = <T,>(list: T[], page: number, perPage: number) => list.slice((page - 1) * perPage, page * perPage);
