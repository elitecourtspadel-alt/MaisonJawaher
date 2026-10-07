import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { isTestMode } from '@/lib/mode';
import { AdminShell } from '@/components/admin/shell';
import { IdleSession } from '@/components/admin/idle-session';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const [o, m] = await Promise.all([
    admin.privileges.includes('orders.view') ? sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new') : { count: 0 },
    admin.privileges.includes('messages.view') ? sb.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false) : { count: 0 },
  ]);
  return (
    <AdminShell testMode={isTestMode()} admin={{ name: admin.name, email: admin.email, roles: admin.roles }} privileges={admin.privileges} badges={{ orders: o.count ?? 0, messages: m.count ?? 0 }}>
      <IdleSession deadline={admin.idleDeadline} sessionKey={admin.sessionKey} />
      {children}
    </AdminShell>
  );
}
