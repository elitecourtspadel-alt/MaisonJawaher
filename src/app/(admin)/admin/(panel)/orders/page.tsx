import { ADMIN_PATH } from '@/lib/admin-path';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePrivilege } from '@/lib/admin-auth';
import { getSettings } from '@/lib/settings';
import type { Order } from '@/lib/types';
import { OrdersManager } from '@/components/admin/orders-manager';

export const metadata = { title: 'Orders' };

const PER_PAGE = 12;

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePrivilege('orders');
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [{ data, count }, s] = await Promise.all([
    createAdminClient().from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
    getSettings(),
  ]);
  return <OrdersManager orders={(data ?? []) as Order[]} currency={s.currency} paging={{ page, perPage: PER_PAGE, total: count ?? 0, basePath: `${ADMIN_PATH}/orders` }} />;
}
