'use client';
import { useActionState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { placeOrder, type FormState } from '@/app/(site)/[locale]/actions';
import { useCart, useSite } from '@/components/site-context';
import { Field, TextArea } from '@/components/ui/field';
import { useFeedback } from '@/components/ui/feedback';
import { Honeypot } from './honeypot';

export function CartView() {
  const { t, locale, settings, price, path } = useSite();
  const { items, setQty, remove, clear, ready } = useCart();
  const { toast, confirm } = useFeedback();
  const [state, action, pending] = useActionState<FormState, FormData>(placeOrder, {});
  const e = state.errors ?? {};
  const allPriced = items.length > 0 && items.every((i) => i.price != null);
  const total = items.reduce((n, i) => n + (i.price ?? 0) * i.qty, 0);

  const done = state.ok && (state.orderNumber ?? 0) > 0;
  useEffect(() => {
    if (state.ok) clear();
    else if (state.message) toast({ kind: 'error', title: t.toast.error, message: state.message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // The form disappears when the order goes through and the page gets much shorter, which used to leave the visitor looking at the footer
  useEffect(() => { if (done) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [done]);

  if (done) {
    const msg = `${t.cart.successTitle} #${state.orderNumber}`;
    const wa = `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(`${msg}`)}`;
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-ok/15 text-4xl text-ok">✓</div>
        <h1 className="font-display text-4xl">{t.cart.successTitle}</h1>
        <p className="mt-3 text-muted">{t.cart.successBody}</p>
        <p className="mt-6 text-sm uppercase tracking-widest text-accent">{t.cart.orderNumber} · #{state.orderNumber}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline"><FaWhatsapp className="size-4 text-[#25d366]" />{t.cart.viewWhatsApp}</a>
          <Link href={path('/shop')} className="btn btn-primary">{t.cart.continue}</Link>
        </div>
      </div>
    );
  }

  if (ready && !items.length) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-3xl">{t.cart.empty}</p>
        <Link href={path('/shop')} className="btn btn-primary mt-8">{t.cart.continue}</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.id} className="card flex gap-4 p-3 sm:p-4">
            <Link href={path(`/product/${i.slug}`)} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:size-28">
              {i.image && <Image src={i.image} alt="" fill sizes="112px" className="object-cover" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <Link href={path(`/product/${i.slug}`)} className="font-display text-xl leading-tight hover:text-accent">{i.name}</Link>
                <button aria-label={t.cart.remove} onClick={() => remove(i.id)} className="rounded-full p-2 text-muted transition hover:text-danger"><Trash2 className="size-4" /></button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center rounded-full border border-line">
                  <button aria-label="−" onClick={() => setQty(i.id, i.qty - 1)} className="grid size-9 place-items-center hover:text-accent"><Minus className="size-3.5" /></button>
                  <span className="w-7 text-center text-sm tabular-nums">{i.qty}</span>
                  <button aria-label="+" onClick={() => setQty(i.id, i.qty + 1)} className="grid size-9 place-items-center hover:text-accent"><Plus className="size-3.5" /></button>
                </div>
                {i.price != null && <span className="font-medium">{price(i.price * i.qty)}</span>}
              </div>
            </div>
          </li>
        ))}
        <li><button className="text-sm text-muted underline-offset-4 hover:text-danger hover:underline" onClick={async () => { if (await confirm({ title: t.cart.title, message: t.cart.remove + '?', danger: true, confirmLabel: t.cart.remove, cancelLabel: t.common.close })) clear(); }}>{t.cart.remove} ✕</button></li>
      </ul>

      <form action={action} noValidate className="card grid h-fit gap-4 p-5 sm:p-7 lg:sticky lg:top-28" aria-busy={pending}>
        <Honeypot locale={locale} />
        <input type="hidden" name="cart" value={JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty })))} />
        <h2 className="font-display text-2xl">{t.cart.checkoutTitle}</h2>
        <Field label={t.cart.name} name="name" autoComplete="name" required error={e.name} />
        <Field label={t.cart.phone} name="phone" type="tel" inputMode="tel" autoComplete="tel" required error={e.phone} />
        <Field label={t.cart.email} name="email" type="email" inputMode="email" autoComplete="email" error={e.email} />
        <div className="grid gap-4 sm:grid-cols-2"><Field label={t.cart.city} name="city" autoComplete="address-level2" required error={e.city} /><div className="sm:col-span-1" /></div>
        <TextArea label={t.cart.address} name="address" required rows={3} error={e.address} autoComplete="street-address" />
        <TextArea label={t.cart.notes} name="notes" rows={2} error={e.notes} />
        {allPriced && settings.show_prices && (
          <div className="flex items-center justify-between border-t border-line pt-4 text-lg"><span>{t.cart.total}</span><b>{price(total)}</b></div>
        )}
        <p className="text-xs text-muted">{allPriced ? t.cart.cod : t.cart.inquiryNote}</p>
        <p className="text-xs text-muted">{t.cart.agree} <Link href={path('/terms')} className="underline underline-offset-2 hover:text-accent">{t.footer.terms}</Link> {t.common.and} <Link href={path('/privacy')} className="underline underline-offset-2 hover:text-accent">{t.footer.privacy}</Link>.</p>
        <button className="btn btn-primary w-full" disabled={pending || !items.length}>{pending ? t.cart.placing : t.cart.placeOrder}</button>
      </form>
    </div>
  );
}
