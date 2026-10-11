'use client';
import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export function FieldError({ id, message }: { id?: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p id={id} role="alert" initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
          className="flex items-start gap-1.5 overflow-hidden pt-1.5 text-[0.8rem] leading-snug text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" /> <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

type Common = { label: ReactNode; error?: string; hint?: string; required?: boolean };

export function Field({ label, error, hint, required, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={error ? 'animate-shake' : ''} key={error ? 'e' : 'n'}>
      <label htmlFor={id} className="mb-1.5 block text-[0.8rem] font-medium tracking-wide">{label}{required && <span className="text-accent"> *</span>}</label>
      {rest.type === 'password'
        ? <PasswordInput id={id} error={error} required={required} {...rest} />
        : <input id={id} className="input" aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} required={required} {...rest} />}
      {hint && !error && <p className="pt-1.5 text-xs text-muted">{hint}</p>}
      <FieldError id={`${id}-e`} message={error} />
    </div>
  );
}

/** Password box with an eye button that shows or hides what was typed. */
function PasswordInput({ id, error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { id: string; error?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input id={id} className="input pr-12" aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} {...rest} type={shown ? 'text' : 'password'} />
      <button type="button" onClick={() => setShown((v) => !v)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} title={shown ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-accent/15 hover:text-fg">
        {shown ? <EyeOff className="size-[1.1rem]" /> : <Eye className="size-[1.1rem]" />}
      </button>
    </div>
  );
}

export function TextArea({ label, error, hint, required, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={error ? 'animate-shake' : ''} key={error ? 'e' : 'n'}>
      <label htmlFor={id} className="mb-1.5 block text-[0.8rem] font-medium tracking-wide">{label}{required && <span className="text-accent"> *</span>}</label>
      <textarea id={id} className="input" aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} required={required} {...rest} />
      {hint && !error && <p className="pt-1.5 text-xs text-muted">{hint}</p>}
      <FieldError id={`${id}-e`} message={error} />
    </div>
  );
}

export function Switch({ name, label, hint, defaultChecked, checked, onChange, disabled }: { name?: string; label: string; hint?: string; defaultChecked?: boolean; checked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <label htmlFor={id} className={`flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 transition ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-accent/60'}`}>
      <span><span className="block text-sm font-medium">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <input id={id} type="checkbox" name={name} disabled={disabled} className="peer sr-only" defaultChecked={defaultChecked} checked={checked} onChange={onChange ? (e) => onChange(e.target.checked) : undefined} />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h3 className="font-display text-xl">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}
