'use client';
import { ADMIN_PATH } from '@/lib/admin-path';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { permanentPasswordAction } from '@/app/(admin)/admin/auth-actions';
import { Field } from '@/components/ui/field';
import { LogoMark } from '@/components/site/logo';
import { ThemeToggle } from '@/components/site/theme-toggle';
export function ResetPasswordForm() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <div className="relative grid min-h-dvh place-items-center bg-bg p-5">
    <div className="absolute right-5 top-5"><ThemeToggle /></div>
    <div className="glass w-full max-w-md rounded-[2rem] p-7 sm:p-10">
      <LogoMark className="mx-auto h-24 text-brand dark:text-accent" />
      <h1 className="mt-5 text-center font-display text-3xl">Choose your permanent password</h1>
      <p className="mt-3 text-center text-sm leading-6 text-muted">Your temporary password gives access only to this step. Choose at least 12 characters, then sign in with your new password.</p>
      <form className="mt-7 grid gap-5" onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); setBusy(true); setError(''); try { const r = await permanentPasswordAction(String(fd.get('password')), String(fd.get('confirm'))); if (!r.ok) setError(r.error); else { router.replace(`${ADMIN_PATH}/login?reason=password-changed`); router.refresh(); } } catch { setError('The connection was interrupted. Please try again.'); } finally { setBusy(false); } }}>
        <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Set permanent password'}</button>
      </form>
    </div>
  </div>;
}
