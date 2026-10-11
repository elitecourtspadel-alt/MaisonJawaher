'use client';
import { useState } from 'react';
import { Mail, MapPin, Phone, Trash2 } from 'lucide-react';
import type { Message, Order } from '@/lib/types';
import { deleteMessage, deleteOrder, setMessageRead, setOrderStatus } from '@/app/(admin)/admin/actions/inbox';
import { PageHeader, useAdmin } from './shell';
import { EmptyState, useRun } from './bits';
import { Pagination } from './pagination';
import { RefreshButton } from './refresh-button';
import { Select } from '@/components/ui/floating';
import { useFeedback } from '@/components/ui/feedback';

const statuses = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));
const tone: Record<string, string> = { new: 'bg-accent/20 text-accent', confirmed: 'bg-brand/15 text-brand dark:text-accent', shipped: 'bg-brand/15 text-brand dark:text-accent', delivered: 'bg-ok/15 text-ok', cancelled: 'bg-danger/10 text-danger' };

type Paging = { page: number; perPage: number; total: number; basePath: string };

export function OrdersManager({ orders, currency, paging }: { orders: Order[]; currency: string; paging: Paging }) {
  const { can } = useAdmin();
  const { run } = useRun();
  const { confirm } = useFeedback();
  return (
    <>
      <PageHeader title="Orders" description={`${paging.total} placed from the cart (cash on delivery), newest first. Change the status as you fulfil them.`}><RefreshButton /></PageHeader>
      {!orders.length ? <EmptyState><p>No orders yet.</p></EmptyState> : (
        <ul className="grid gap-4">
          {orders.map((o) => (
            <li key={o.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl">#{o.number} · {o.name}</p>
                  <p className="text-xs text-muted">{new Date(o.created_at).toLocaleString()} · {o.locale.toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${tone[o.status]}`}>{o.status}</span>
                  {can('orders.update') && <Select value={o.status} onChange={(v) => run(() => setOrderStatus(o.id, v), { title: 'Status updated', message: `Order #${o.number} is now ${statuses.find((s) => s.value === v)?.label ?? v}.` })} options={statuses} className="w-40" />}
                  {can('orders.delete') && <button aria-label="Delete order" onClick={async () => { if (await confirm({ title: `Delete order #${o.number}?`, danger: true, confirmLabel: 'Delete' })) run(() => deleteOrder(o.id), { title: 'Order deleted', message: `Order #${o.number} has been removed.` }); }} className="rounded-full p-2 text-danger hover:bg-danger/10"><Trash2 className="size-4" /></button>}
                </div>
              </div>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <ul className="grid gap-1.5 text-muted">
                  <li className="flex gap-2"><Phone className="mt-0.5 size-4 text-accent" /><a href={`tel:${o.phone}`} className="hover:text-accent">{o.phone}</a></li>
                  {o.email && <li className="flex gap-2"><Mail className="mt-0.5 size-4 text-accent" /><a href={`mailto:${o.email}`} className="break-all hover:text-accent">{o.email}</a></li>}
                  <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-accent" />{o.city} — {o.address}</li>
                  {o.notes && <li className="italic">“{o.notes}”</li>}
                </ul>
                <div>
                  <ul className="divide-y divide-line">{o.items.map((i) => <li key={i.id} className="flex justify-between gap-3 py-1.5"><span>{i.name} × {i.qty}</span><span className="text-muted">{i.price != null ? `${i.price * i.qty} ${currency}` : '—'}</span></li>)}</ul>
                  {o.total != null && <p className="mt-2 flex justify-between border-t border-line pt-2 font-medium"><span>Total</span><span>{o.total} {currency}</span></p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination {...paging} noun="orders" />
    </>
  );
}

export function MessagesManager({ messages, paging }: { messages: Message[]; paging: Paging }) {
  const { can } = useAdmin();
  const { run } = useRun();
  const { confirm } = useFeedback();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <PageHeader title="Messages" description="Submissions from the contact form, newest first."><RefreshButton /></PageHeader>
      {!messages.length ? <EmptyState><p>No messages yet.</p></EmptyState> : (
        <ul className="grid gap-3">
          {messages.map((m) => {
            const isOpen = open === m.id;
            return (
              <li key={m.id} className={`card overflow-hidden ${m.is_read ? '' : 'border-accent/60'}`}>
                <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => { setOpen(isOpen ? null : m.id); if (!m.is_read && can('messages.update')) run(() => setMessageRead(m.id, true)); }}>
                  {!m.is_read && <span className="size-2.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                  <span className="min-w-0 flex-1"><b className="block truncate">{m.subject || '(no subject)'}</b><span className="block truncate text-sm text-muted">{m.name} · {m.email}</span></span>
                  <span className="shrink-0 text-xs text-muted">{new Date(m.created_at).toLocaleDateString()}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-line p-4 text-sm">
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    {m.phone && <p className="mt-3 text-muted">Phone: <a href={`tel:${m.phone}`} className="text-accent">{m.phone}</a></p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a className="btn btn-primary !min-h-10" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>Reply</a>
                      {can('messages.update') && <button className="btn btn-outline !min-h-10" onClick={() => run(() => setMessageRead(m.id, false))}>Mark as unread</button>}
                      {can('messages.delete') && <button className="btn btn-ghost !min-h-10 text-danger" onClick={async () => { if (await confirm({ title: 'Delete this message?', danger: true, confirmLabel: 'Delete' })) run(() => deleteMessage(m.id), { title: 'Message deleted', message: `The message from ${m.name} has been removed.` }); }}>Delete</button>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Pagination {...paging} noun="messages" />
    </>
  );
}
