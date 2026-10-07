import { ADMIN_PATH } from '@/lib/admin-path';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePrivilege } from '@/lib/admin-auth';
import type { Message } from '@/lib/types';
import { MessagesManager } from '@/components/admin/orders-manager';

export const metadata = { title: 'Messages' };

const PER_PAGE = 15;

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePrivilege('messages');
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { data, count } = await createAdminClient().from('messages').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  return <MessagesManager messages={(data ?? []) as Message[]} paging={{ page, perPage: PER_PAGE, total: count ?? 0, basePath: `${ADMIN_PATH}/messages` }} />;
}
