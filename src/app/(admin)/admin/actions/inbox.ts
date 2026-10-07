'use server';
import { ADMIN_PATH } from '@/lib/admin-path';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { audit } from '@/lib/admin/audit';
import { guard, updatedBy } from '@/lib/admin/guard';
import { fail, type Result } from '@/lib/admin/result';

const STATUS = { new: 'New', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' } as const;
const refresh = () => revalidatePath(`${ADMIN_PATH}`, 'layout');

export async function setOrderStatus(id: string, status: string): Promise<Result> {
  try {
    const next = z.enum(['new', 'confirmed', 'shipped', 'delivered', 'cancelled']).parse(status);
    const { admin, sb } = await guard('orders', 'update');
    const { data: o } = await sb.from('orders').select('number, name, status').eq('id', id).maybeSingle();
    if (!o) return { ok: false, error: 'That order no longer exists.' };
    const { error } = await sb.from('orders').update({ status: next, ...updatedBy(admin) }).eq('id', id);
    if (error) return { ok: false, error: error.message };
    const label = `#${o.number} (${o.name})`;
    await audit(sb, admin, {
      action: 'changed', entity: 'order', entityId: id, label,
      summary: `Changed the status of order ${label} from ${STATUS[o.status as keyof typeof STATUS]} to ${STATUS[next]}.`,
      changes: [{ label: 'Status', from: STATUS[o.status as keyof typeof STATUS], to: STATUS[next] }],
    });
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function deleteOrder(id: string): Promise<Result> {
  try {
    const { admin, sb } = await guard('orders', 'delete');
    const { data: o } = await sb.from('orders').select('number, name').eq('id', id).maybeSingle();
    const { error } = await sb.from('orders').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    if (o) await audit(sb, admin, { action: 'deleted', entity: 'order', entityId: id, label: `#${o.number} (${o.name})`, summary: `Deleted order #${o.number} from ${o.name}.` });
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function setMessageRead(id: string, read: boolean): Promise<Result> {
  try {
    const { admin, sb } = await guard('messages', 'update');
    const { error } = await sb.from('messages').update({ is_read: read, ...updatedBy(admin) }).eq('id', id);
    if (error) return { ok: false, error: error.message };
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function deleteMessage(id: string): Promise<Result> {
  try {
    const { admin, sb } = await guard('messages', 'delete');
    const { data: m } = await sb.from('messages').select('name, subject').eq('id', id).maybeSingle();
    const { error } = await sb.from('messages').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    if (m) await audit(sb, admin, { action: 'deleted', entity: 'message', entityId: id, label: m.subject || m.name, summary: `Deleted the message from ${m.name}${m.subject ? ` about “${m.subject}”` : ''}.` });
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}
