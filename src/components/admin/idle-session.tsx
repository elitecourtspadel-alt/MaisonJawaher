'use client';
import { ADMIN_PATH } from '@/lib/admin-path';
import { useEffect, useState } from 'react';
import { expireAdminSession, renewAdminActivity } from '@/app/(admin)/admin/actions/session';

export function IdleSession({ deadline: initial, sessionKey }: { deadline: number; sessionKey: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const key = `mj-admin-deadline:${sessionKey}`;
    let deadline = initial;
    let sentAt = 0;
    let busy = false;
    let disposed = false;
    const publish = (value: number) => {
      deadline = value;
      try { localStorage.setItem(key, String(value)); } catch {}
      setRemaining(null);
    };
    const renew = async () => {
      if (busy || document.hidden || Date.now() >= deadline || Date.now() - sentAt < 15_000) return;
      busy = true; sentAt = Date.now();
      try { const r = await renewAdminActivity(); if (!disposed && r.ok) publish(r.deadline); }
      catch { /* Retry on later activity; never extend a failed renewal locally. */ }
      finally { busy = false; }
    };
    const tick = async () => {
      const seconds = Math.ceil((deadline - Date.now()) / 1000);
      if (seconds > 0) { setRemaining(seconds <= 60 ? seconds : null); return; }
      if (busy) return;
      busy = true;
      try {
        const r = await expireAdminSession();
        if (disposed) return;
        if (r.expired) window.location.replace(`${ADMIN_PATH}/login?reason=idle`);
        else publish(r.deadline);
      } catch { setRemaining(0); }
      finally { busy = false; }
    };
    const sync = (e: StorageEvent) => {
      if (e.key === key && e.newValue) { const value = Number(e.newValue); if (Number.isFinite(value) && value > deadline) deadline = value; }
    };
    // The server-provided deadline wins at mount. Never reset inactivity simply by opening a tab.
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((event) => window.addEventListener(event, renew, { passive: true }));
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('mj-admin-stay', renew);
    const timer = setInterval(tick, 1000);
    void tick();
    return () => { disposed = true; clearInterval(timer); events.forEach((event) => window.removeEventListener(event, renew)); window.removeEventListener('storage', sync); document.removeEventListener('visibilitychange', tick); window.removeEventListener('mj-admin-stay', renew); };
  }, [initial, sessionKey]);
  if (remaining === null) return null;
  return <div role="alert" className="fixed bottom-24 right-4 z-[100] max-w-sm rounded-2xl border border-accent bg-surface p-5 shadow-xl">
    <p className="font-medium">{remaining > 0 ? `Your session expires in ${remaining} seconds` : 'Your session has expired'}</p>
    <p className="mt-2 text-sm text-muted">{remaining > 0 ? 'Stay signed in to continue editing. Unsaved changes will be lost if you sign out.' : 'Sign in again to continue. Your current edits are still visible here.'}</p>
    {remaining > 0 ? <button type="button" className="btn btn-primary mt-4" onClick={() => window.dispatchEvent(new Event('mj-admin-stay'))}>Stay signed in</button> : <a className="btn btn-primary mt-4" href={`${ADMIN_PATH}/login`}>Sign in again</a>}
  </div>;
}
