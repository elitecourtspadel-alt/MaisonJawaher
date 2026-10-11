'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedback } from '@/components/ui/feedback';
import type { Result } from '@/lib/admin/result';

/** Runs a server action, shows the outcome as a toast (a title, or a title with a line of detail), and refreshes the server data. */

/** The first non-empty wording of a field across languages, used to name an item in a message. */
export const firstText = (tr: Record<string, Record<string, string>>, key: string) => Object.values(tr).map((v) => v?.[key]?.trim()).find(Boolean) ?? '';

export function useRun() {
  const { toast } = useFeedback();
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = async <T extends Result<any>>(fn: () => Promise<T>, success?: string | { title: string; message?: string }): Promise<T> => {
    const r = (await fn()) as Result<any>;
    if (r.ok) { if (success) toast({ kind: 'success', ...(typeof success === 'string' ? { title: success } : success) }); if (r.warning) toast({ kind: 'info', title: 'Image cleanup needs attention', message: r.warning }); router.refresh(); }
    else toast({ kind: 'error', title: 'We could not save that', message: r.error });
    return r as T;
  };
  return { run, pending, start };
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="card grid place-items-center gap-2 p-12 text-center text-muted">{children}</div>;
}

export function StatusPill({ on, onLabel = 'Active', offLabel = 'Inactive' }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider ${on ? 'bg-ok/15 text-ok' : 'bg-line text-muted'}`}>{on ? onLabel : offLabel}</span>;
}

/** Small on/off switch used in lists. */
export function ActiveSwitch({ on, onChange, disabled, label }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      title={disabled ? 'You are not allowed to turn this on or off' : on ? 'Active: click to turn off' : 'Inactive: click to turn on'}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'bg-brand' : 'bg-line'}`}>
      <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}
