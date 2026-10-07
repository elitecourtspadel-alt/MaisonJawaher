'use client';
import { useActionState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Send } from 'lucide-react';
import { submitContact, type FormState } from '@/app/(site)/[locale]/actions';
import { useSite } from '@/components/site-context';
import { Field, TextArea } from '@/components/ui/field';
import { useFeedback } from '@/components/ui/feedback';
import { Honeypot } from './honeypot';

export function ContactForm() {
  const { t, locale } = useSite();
  const { toast } = useFeedback();
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, {});
  const form = useRef<HTMLFormElement>(null);
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.ok) { form.current?.reset(); toast({ kind: 'success', title: t.contact.successTitle, message: t.contact.successBody }); }
    else if (state.message) toast({ kind: 'error', title: t.toast.error, message: state.message });
  }, [state, t, toast]);

  return (
    <div className="relative">
      <form ref={form} action={action} noValidate className="grid gap-5" aria-busy={pending}>
        <Honeypot locale={locale} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.contact.name} name="name" autoComplete="name" required error={e.name} />
          <Field label={t.contact.email} name="email" type="email" autoComplete="email" inputMode="email" required error={e.email} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.contact.phone} name="phone" type="tel" autoComplete="tel" inputMode="tel" error={e.phone} />
          <Field label={t.contact.subject} name="subject" error={e.subject} />
        </div>
        <TextArea label={t.contact.message} name="body" required error={e.body} />
        <button className="btn btn-primary w-full sm:w-auto sm:self-start" disabled={pending}>
          <Send className="size-4" />{pending ? t.common.sending : t.common.send}
        </button>
      </form>
      <AnimatePresence>
        {state.ok && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-5 flex items-center gap-3 rounded-2xl border border-ok/40 bg-ok/10 p-4 text-sm">
            <CheckCircle2 className="size-5 text-ok" /><span><b>{t.contact.successTitle}.</b> {t.contact.successBody}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
