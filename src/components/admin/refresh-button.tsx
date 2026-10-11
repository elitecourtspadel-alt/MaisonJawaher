'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

/** Re-reads the current page from the server, so new orders or messages show up without reloading the browser. */
export function RefreshButton({ label = 'Refresh' }: { label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-outline" disabled={pending} aria-busy={pending} onClick={() => start(() => router.refresh())}>
      <RefreshCw className={`size-4 ${pending ? 'animate-spin' : ''}`} />{pending ? 'Refreshing…' : label}
    </button>
  );
}
