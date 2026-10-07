import { ADMIN_PATH } from '@/lib/admin-path';
import { History } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePrivilege } from '@/lib/admin-auth';
import type { AuditEntry } from '@/lib/types';
import { PageHeader } from '@/components/admin/shell';
import { AuditFilters } from '@/components/admin/audit-filters';
import { Pagination } from '@/components/admin/pagination';
import { RefreshButton } from '@/components/admin/refresh-button';

export const metadata = { title: 'Audit history' };

const PAGE = 25;
const stamp = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Casablanca' });
const ICON: Record<string, string> = { created: 'Added', changed: 'Changed', deleted: 'Deleted', turned_on: 'Turned on', turned_off: 'Turned off', signed_in: 'Signed in', signed_out: 'Signed out', security: 'Security' };
const TONE: Record<string, string> = { created: 'bg-ok/15 text-ok', changed: 'bg-brand/15 text-brand dark:text-accent', deleted: 'bg-danger/10 text-danger', turned_on: 'bg-ok/15 text-ok', turned_off: 'bg-line text-muted', signed_in: 'bg-accent/20 text-accent', signed_out: 'bg-accent/20 text-accent', security: 'bg-accent/20 text-accent' };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; area?: string; sort?: string; page?: string }> }) {
  await requirePrivilege('audit');
  const { q = '', area = '', sort: s = 'new', page: p = '1' } = await searchParams;
  const sort = s === 'old' ? 'old' : 'new';
  const page = Math.max(1, Number(p) || 1);
  let query = createAdminClient().from('audit_log').select('*', { count: 'exact' }).order('created_at', { ascending: sort === 'old' });
  if (area) query = query.eq('entity', area);
  if (q.trim()) query = query.ilike('summary', `%${q.trim().replace(/[%,]/g, ' ')}%`);
  const { data, count } = await query.range((page - 1) * PAGE, page * PAGE - 1);
  const rows = (data ?? []) as AuditEntry[];
  const keep = { ...(q ? { q } : {}), ...(area ? { area } : {}), ...(sort === 'old' ? { sort } : {}) };

  return (
    <>
      <PageHeader title="Audit history" description="Who changed what, and when. Every change made in the admin portal is listed here."><RefreshButton /></PageHeader>
      <AuditFilters q={q} area={area} sort={sort} />
      {!rows.length ? (
        <div className="card grid place-items-center gap-2 p-12 text-center text-muted"><History className="size-6 text-accent" strokeWidth={1.5} /><p>Nothing to show{q || area ? ' for this search' : ' yet'}.</p></div>
      ) : (
        <ol className="grid gap-3">
          {rows.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <p className="text-[0.95rem]"><b className="font-medium">{r.actor_name || 'Someone'}</b> <span className="text-muted">·</span> {r.summary}</p>
                <time dateTime={r.created_at} className="shrink-0 text-xs text-muted">{stamp.format(new Date(r.created_at))}</time>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-0.5 font-medium ${TONE[r.action] ?? 'bg-line text-muted'}`}>{ICON[r.action] ?? r.action}</span>
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 capitalize text-muted">{r.entity}</span>
              </div>
              {Array.isArray(r.details) && r.details.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-accent">See what changed</summary>
                  <ul className="mt-2 grid gap-1.5 rounded-xl bg-surface-2/60 p-3">
                    {r.details.map((d, i) => (
                      <li key={i}><b className="font-medium">{d.label}</b>{d.from !== undefined && <> from <span className="text-muted">“{d.from}”</span> to <span>“{d.to}”</span></>}{d.from === undefined && d.to && <> {d.to}</>}</li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}
      <Pagination page={page} perPage={PAGE} total={count ?? 0} basePath={`${ADMIN_PATH}/audit`} query={keep} noun="entries" />
    </>
  );
}
