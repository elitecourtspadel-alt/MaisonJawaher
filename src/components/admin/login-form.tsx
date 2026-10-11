'use client';
import { ADMIN_PATH } from '@/lib/admin-path';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { forgotPasswordAction, loginAction, loginMfaAction, logoutAction } from '@/app/(admin)/admin/auth-actions';
import { Field } from '@/components/ui/field';
import { Starfield } from '@/components/ui/starfield';
import { useFeedback } from '@/components/ui/feedback';
import { LogoMark } from '@/components/site/logo';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { useTrustConfirmation } from './use-trust-confirmation';

export function LoginForm({ configured, testMode, setupMessage = '', notice = '', trustedDays = 30, trustEnabled = true }: { configured: boolean; testMode: boolean; setupMessage?: string; notice?: string; trustedDays?: number; trustEnabled?: boolean }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const confirmTrust = useTrustConfirmation();
  const [step, setStep] = useState<'password' | 'mfa' | 'forgot'>('password');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const finish = () => { router.replace(`${ADMIN_PATH}`); router.refresh(); };

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email')).trim(), password = String(fd.get('password'));
    const err: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) err.email = 'Enter a valid email address';
    if (!password) err.password = 'Password is required';
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    let r;
    try { r = await loginAction(email, password); }
    catch { setBusy(false); setErrors({ password: 'The connection was interrupted. Please try again.' }); return; }
    setBusy(false);
    if (!r.ok) { setErrors({ password: r.error }); return; }
    if (r.reset) { router.replace(`${ADMIN_PATH}/reset-password`); router.refresh(); return; }
    if (r.setupMfa) { router.replace(`${ADMIN_PATH}/setup-2fa`); router.refresh(); return; }
    if (r.mfa) { setStep('mfa'); return; }
    finish();
  };

  const verify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code')).replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) { setErrors({ code: 'Enter the 6-digit code from your authenticator app' }); return; }
    setBusy(true);
    let r;
    try { r = await loginMfaAction(code, new FormData(e.currentTarget).get('trust') === 'on'); }
    catch { setBusy(false); setErrors({ code: 'The connection was interrupted. Please try again.' }); return; }
    setBusy(false);
    if (!r.ok) { setErrors({ code: r.error }); return; }
    if (r.trustError) toast({ kind: 'error', title: 'Signed in, but this device was not saved', message: r.trustError });
    await confirmTrust(r.trustLimit);
    toast({ kind: 'success', title: 'Welcome back' });
    finish();
  };

  const cancel = async () => { await logoutAction(); setStep('password'); setErrors({}); };
  const recover = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const email = String(new FormData(e.currentTarget).get('email')).trim();
    setBusy(true); setErrors({}); setRecoveryMessage('');
    try { const r = await forgotPasswordAction(email); if (!r.ok) setErrors({ email: r.error }); else setRecoveryMessage(r.message); }
    catch { setErrors({ email: 'The connection was interrupted. Please try again.' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="admin-auth-background relative grid min-h-dvh place-items-center overflow-hidden p-5 pt-20 text-fg sm:p-10">
      <Starfield />
      <div className="absolute right-5 top-5 z-20 rounded-full border border-line bg-surface"><ThemeToggle /></div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[var(--shadow)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-wine flex flex-col items-center justify-center px-8 py-9 text-center md:px-12 md:py-16">
          <LogoMark className="h-24 text-[#f7ecdd] md:h-52" />
          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-[#e9c887]">Maison Jawaher</p>
          <h2 className="mt-4 hidden font-display text-4xl leading-tight md:block">The care behind<br />every collection.</h2>
          <p className="mt-5 hidden max-w-xs text-sm leading-7 text-[#f7ecdd]/80 md:block">A private space to curate your pieces, care for your customers and tell your story.</p>
        </div>
        <div className="p-7 sm:p-10 md:py-14">
        <p className="eyebrow">Your private workspace</p>
        <h1 className="mt-3 font-display text-4xl">{step === 'forgot' ? 'Recover your account' : 'Welcome back'}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{step === 'forgot' ? 'We’ll email a temporary password, valid for 15 minutes. Use it to sign in and choose a permanent password.' : 'Sign in to manage your Maison Jawaher store.'}</p>
        {testMode && <p className="mt-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-center text-xs">Test mode — running without Supabase. Create an admin with <code>create-admin.bat</code>.</p>}
        {!configured && <p role="status" className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm leading-6">{setupMessage || 'The store connection is not ready yet. Please ask the site owner to finish the setup.'}</p>}
        {notice && <p role="status" className="mt-4 rounded-xl border border-ok/40 bg-ok/10 p-3 text-sm">{notice}</p>}
        <AnimatePresence mode="wait">
          {step === 'password' ? (
            <motion.form key="pw" method="post" onSubmit={signIn} noValidate initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="mt-7 grid gap-5">
              <Field label="Email" name="email" type="email" autoComplete="username" inputMode="email" error={errors.email} />
              <Field label="Password" name="password" type="password" autoComplete="current-password" error={errors.password} />
              <button className="btn btn-primary w-full" disabled={busy || !configured}><Lock className="size-4" />{busy ? 'Signing in…' : 'Sign in'}</button>
              <button type="button" className="text-sm text-muted hover:text-accent" disabled={busy} onClick={() => { setStep('forgot'); setErrors({}); }}>Forgot your password?</button>
            </motion.form>
          ) : step === 'forgot' ? (
            <motion.form key="forgot" method="post" onSubmit={recover} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-7 grid gap-5">
              <Field label="Admin email" name="email" type="email" autoComplete="email" required error={errors.email} />
              {recoveryMessage && <p role="status" className="rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm leading-6">{recoveryMessage}</p>}
              <button className="btn btn-primary" disabled={busy || !configured}>{busy ? 'Requesting…' : 'Email temporary password'}</button>
              <button type="button" className="text-sm text-muted hover:text-accent" disabled={busy} onClick={() => { setStep('password'); setErrors({}); setRecoveryMessage(''); }}>Back to sign in</button>
            </motion.form>
          ) : (
            <motion.form key="mfa" method="post" onSubmit={verify} noValidate initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-7 grid gap-5">
              <p className="flex items-start gap-3 text-sm text-muted"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />Two-factor authentication is enabled. Enter the 6-digit code from your authenticator app.</p>
              <Field label="Authentication code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} autoFocus placeholder="123456" error={errors.code} className="input text-center text-2xl tracking-[0.5em]" />
              {trustEnabled && <label className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm"><input type="checkbox" name="trust" className="mt-1 size-4 accent-brand" /><span>Trust this device for {trustedDays} days<span className="mt-1 block text-xs text-muted">Skip the 2FA code on this browser after password sign-in. Use only on a private device.</span></span></label>}
              <button className="btn btn-primary w-full" disabled={busy}><KeyRound className="size-4" />{busy ? 'Verifying…' : 'Verify'}</button>
              <button type="button" onClick={cancel} className="text-sm text-muted hover:text-accent">Use a different account</button>
            </motion.form>
          )}
        </AnimatePresence>
        <p className="mt-8 flex items-center gap-2 border-t border-line pt-5 text-xs text-muted"><ShieldCheck className="size-4 text-accent" />Protected access · For authorized team members</p>
        </div>
      </motion.div>
    </div>
  );
}
