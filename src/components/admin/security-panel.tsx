'use client';
import { ADMIN_PATH } from '@/lib/admin-path';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { mfaBeginAction, mfaConfirmAction, mfaDisableAction, loginMfaAction } from '@/app/(admin)/admin/auth-actions';
import { PageHeader } from './shell';
import { Field, FormSection } from '@/components/ui/field';
import { useFeedback } from '@/components/ui/feedback';
import { useTrustConfirmation } from './use-trust-confirmation';

export function SecurityPanel({ enabled, factorId, required = false, onboarding = false, verified = true, trustEnabled = true, trustedDays = 30 }: { enabled: boolean; factorId: string | null; required?: boolean; onboarding?: boolean; verified?: boolean; trustEnabled?: boolean; trustedDays?: number }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const confirmTrust = useTrustConfirmation();
  const [setup, setSetup] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const begin = async () => {
    setBusy(true); setError('');
    const r = await mfaBeginAction();
    setBusy(false);
    if (!r.ok) { toast({ kind: 'error', title: 'Could not start setup', message: r.error }); return; }
    setSetup({ id: r.id, qr: r.qr, secret: r.secret });
  };

  const confirmCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code')).replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code shown in your app'); return; }
    setBusy(true);
    const r = await mfaConfirmAction(setup!.id, code, new FormData(e.currentTarget).get('trust') === 'on');
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setSetup(null); setError('');
    if (r.trustError) toast({ kind: 'error', title: '2FA enabled, but this device was not saved', message: r.trustError });
    await confirmTrust(r.trustLimit);
    toast({ kind: 'success', title: 'Two-factor authentication enabled', message: 'A code is required on browsers that are not trusted.' });
    if (onboarding) router.replace(`${ADMIN_PATH}`);
    router.refresh();
  };

  const disable = async () => {
    if (!factorId || !(await confirm({ title: 'Turn off two-factor authentication?', message: 'Your account will be protected by your password only.', danger: true, confirmLabel: 'Turn off' }))) return;
    setBusy(true);
    const r = await mfaDisableAction(factorId);
    setBusy(false);
    if (!r.ok) { toast({ kind: 'error', title: 'Could not disable 2FA', message: r.error }); return; }
    toast({ kind: 'success', title: 'Two-factor authentication disabled' });
    router.refresh();
  };

  return (
    <>
      <PageHeader title={onboarding ? 'Secure your admin account' : 'Security & 2FA'} description={`Protect the admin portal with a one-time code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy…). ${required ? '2FA is mandatory for this account. Verify your authenticator before entering the portal.' : 'It is optional.'}`} />
      <FormSection title="Two-factor authentication">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className={`grid size-12 place-items-center rounded-full ${enabled ? 'bg-ok/15 text-ok' : 'bg-line text-muted'}`}>{enabled ? <ShieldCheck /> : <ShieldOff />}</span>
            <div><p className="font-medium">{enabled ? 'Enabled' : 'Not enabled'}</p><p className="text-sm text-muted">{enabled ? 'A code is required on browsers that are not trusted.' : required ? 'Complete setup to access the portal.' : 'Sign-in needs only your password.'}</p></div>
          </div>
          {enabled ? !required && verified && <button className="btn btn-outline" onClick={disable} disabled={busy}>Turn off</button>
            : !setup && <button className="btn btn-primary" onClick={begin} disabled={busy}>{busy ? 'Preparing…' : 'Enable 2FA'}</button>}
        </div>

        {enabled && !verified && <form className="grid gap-4 rounded-xl border border-line p-4" onSubmit={async (event) => {
          event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError('');
          try { const result = await loginMfaAction(String(data.get('code')), data.get('trust') === 'on'); if (!result.ok) setError(result.error); else { if (result.trustError) toast({ kind: 'error', title: 'Device not saved', message: result.trustError }); await confirmTrust(result.trustLimit); router.refresh(); } }
          catch { setError('Could not verify the code. Please try again.'); } finally { setBusy(false); }
        }}>
          <p className="text-sm text-muted">You signed in using a trusted device. Verify a fresh code to change 2FA or renew this browser’s trust.</p>
          <Field label="Authentication code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} error={error} />
          {trustEnabled && <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="trust" />Trust this device for {trustedDays} days</label>}
          <button className="btn btn-primary justify-self-start" disabled={busy}>Verify code</button>
        </form>}

        {setup && (
          <div className="grid gap-6 rounded-2xl border border-line p-5 sm:grid-cols-[auto_1fr]">
            <div className="mx-auto rounded-2xl bg-white p-3"><Image src={setup.qr} alt="QR code for your authenticator app" width={176} height={176} unoptimized /></div>
            <form method="post" onSubmit={confirmCode} noValidate className="grid content-start gap-4">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted"><li>Scan the QR code with your authenticator app.</li><li>Enter the 6-digit code it shows to confirm.</li></ol>
              <p className="break-all rounded-xl bg-surface-2 p-3 font-mono text-xs">Can’t scan? Enter this key manually: <b>{setup.secret}</b></p>
              <Field label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} error={error} placeholder="123456" />
              {trustEnabled && <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="trust" className="mt-1 size-4 accent-brand" /><span>Trust this device for {trustedDays} days<span className="block text-xs text-muted">Choose only for a private device. Password sign-in remains required.</span></span></label>}
              <div className="flex gap-3"><button className="btn btn-primary" disabled={busy}>{busy ? 'Verifying…' : 'Confirm & enable'}</button><button type="button" className="btn btn-outline" onClick={() => { setSetup(null); setError(''); }}>Cancel</button></div>
            </form>
          </div>
        )}
      </FormSection>
    </>
  );
}
