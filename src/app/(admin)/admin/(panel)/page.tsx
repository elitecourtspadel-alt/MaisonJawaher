import { ADMIN_PATH } from '@/lib/admin-path';
import Link from 'next/link';
import { Inbox, Package, ShoppingBag, Tags } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePrivilege } from '@/lib/admin-auth';
import { PageHeader } from '@/components/admin/shell';

export default async function Dashboard() {
  const admin = await requirePrivilege('dashboard');
  const can = (c: string) => admin.privileges.includes(c);
  const sb = createAdminClient();
  const count = async (t: string, f?: (q: any) => any) => { let q = sb.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); return (await q).count ?? 0; };
  const [products, categories, newOrders, unread] = await Promise.all([
    can('products.view') ? count('products') : null, can('categories.view') ? count('categories') : null,
    can('orders.view') ? count('orders', (q) => q.eq('status', 'new')) : null, can('messages.view') ? count('messages', (q) => q.eq('is_read', false)) : null,
  ]);
  const { data: recent } = can('orders.view') ? await sb.from('orders').select('id,number,name,city,status,created_at').order('created_at', { ascending: false }).limit(6) : { data: [] };
  const cards = [
    { label: 'Products', value: products, href: `${ADMIN_PATH}/products`, Icon: Package },
    { label: 'Categories', value: categories, href: `${ADMIN_PATH}/categories`, Icon: Tags },
    { label: 'New orders', value: newOrders, href: `${ADMIN_PATH}/orders`, Icon: ShoppingBag },
    { label: 'Unread messages', value: unread, href: `${ADMIN_PATH}/messages`, Icon: Inbox },
  ].filter((c) => c.value !== null);

  return (
    <>
      <PageHeader title={`Hello, ${admin.name.split(' ')[0]}`} description="A quick look at the shop." />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card card-hover p-5">
            <c.Icon className="size-5 text-accent" strokeWidth={1.6} />
            <p className="mt-4 font-display text-4xl">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
          </Link>
        ))}
      </div>
      {can('orders.view') && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl">Latest orders</h2>
          <div className="card table-wrap">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-widest text-muted"><tr><th className="p-4">#</th><th>Customer</th><th>City</th><th>Status</th><th className="pr-4 text-right">Date</th></tr></thead>
              <tbody>
                {(recent ?? []).map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0"><td className="p-4">#{o.number}</td><td>{o.name}</td><td>{o.city}</td><td className="capitalize">{o.status}</td><td className="pr-4 text-right text-muted">{new Date(o.created_at).toLocaleDateString('en-GB')}</td></tr>
                ))}
                {!recent?.length && <tr><td colSpan={5} className="p-8 text-center text-muted">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
