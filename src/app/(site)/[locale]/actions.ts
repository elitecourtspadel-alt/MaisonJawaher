'use server';
import { after } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { getDict, isLocale, type Locale } from '@/lib/i18n';
import { notifyNewMessage, notifyNewOrder } from '@/lib/email/notify';
import { looksLikeBot, rateLimit } from '@/lib/spam';
import { flatten, pickTr } from '@/lib/translations';

export type FormState = { ok?: boolean; errors?: Record<string, string>; message?: string; orderNumber?: number };

const phoneRx = /^[+()\d\s.-]{6,20}$/;

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) { const k = String(i.path[0] ?? '_'); out[k] ??= i.message; }
  return out;
}

export async function submitContact(_: FormState, fd: FormData): Promise<FormState> {
  const loc = String(fd.get('locale'));
  const locale: Locale = isLocale(loc) ? loc : 'en';
  const t = getDict(locale);
  if (looksLikeBot(fd)) return { ok: true }; // pretend success, drop silently
  if (!(await rateLimit('contact', 4, 10 * 60_000))) return { message: t.common.somethingWrong };

  const schema = z.object({
    name: z.string().trim().min(2, t.common.required).max(100),
    email: z.string().trim().email(t.common.invalidEmail).max(200),
    phone: z.string().trim().max(20).refine((v) => !v || phoneRx.test(v), t.common.invalidPhone),
    subject: z.string().trim().max(150),
    body: z.string().trim().min(5, t.common.required).max(4000),
  });
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const sb = createAdminClient();
  const { error } = await sb.from('messages').insert({ ...d, locale });
  if (error) { console.error(error); return { message: t.common.somethingWrong }; }

  const settings = await getSettings();
  after(() => notifyNewMessage(d, settings)); // email goes out after the visitor already has their answer
  return { ok: true };
}

const orderSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(phoneRx),
  email: z.string().trim().email().max(200).or(z.literal('')),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(300),
  notes: z.string().trim().max(500),
});

export async function placeOrder(_: FormState, fd: FormData): Promise<FormState> {
  const loc = String(fd.get('locale'));
  const locale: Locale = isLocale(loc) ? loc : 'en';
  const t = getDict(locale);
  if (looksLikeBot(fd)) return { ok: true, orderNumber: 0 };
  if (!(await rateLimit('order', 5, 10 * 60_000))) return { message: t.common.somethingWrong };

  // field-level messages localised
  const parsed = orderSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0]);
      errors[k] ??= k === 'email' ? t.common.invalidEmail : k === 'phone' ? t.common.invalidPhone : t.common.required;
    }
    return { errors };
  }

  let cart: { id: string; qty: number }[] = [];
  try { cart = z.array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(20) })).min(1).max(50).parse(JSON.parse(String(fd.get('cart')))); }
  catch { return { message: t.cart.empty }; }

  const sb = createAdminClient();
  const settings = await getSettings();
  const { data: raw } = await sb.from('products').select('id,slug,price,show_price,is_active,product_translations(*),product_images(url,sort_order),categories(is_active)').in('id', cart.map((c) => c.id)).eq('is_active', true);
  const prods = (flatten(raw ?? []) as any[]).filter((p) => !p.categories || p.categories.is_active);
  if (!prods.length) return { message: t.cart.empty };

  const items = cart.flatMap((c) => {
    const p = prods.find((x) => x.id === c.id);
    if (!p) return [];
    const priced = settings.show_prices && p.show_price && p.price != null;
    const img = [...(p.product_images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ?? null;
    return [{ id: p.id, slug: p.slug, name: pickTr(p.translations, 'name', locale), price: priced ? Number(p.price) : null, qty: c.qty, image: img }];
  });
  const allPriced = items.length > 0 && items.every((i) => i.price != null);
  const total = allPriced ? items.reduce((n, i) => n + (i.price as number) * i.qty, 0) : null;

  const { data: order, error } = await sb.from('orders').insert({ ...parsed.data, items, total, locale }).select('number').single();
  if (error || !order) { console.error(error); return { message: t.common.somethingWrong }; }

  const mail = { number: Number(order.number), ...parsed.data, items: items.map(({ image, ...i }) => i), total, locale };
  after(() => notifyNewOrder(mail, settings));
  return { ok: true, orderNumber: Number(order.number) };
}
