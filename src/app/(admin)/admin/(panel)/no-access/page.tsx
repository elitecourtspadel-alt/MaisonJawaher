import { ADMIN_PATH } from '@/lib/admin-path';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';

export const metadata = { title: 'No access' };

export default async function Page() {
  const admin = await requireAdmin();
  return (
    <div className="card mx-auto mt-16 max-w-lg p-8 text-center">
      <Lock className="mx-auto size-8 text-accent" strokeWidth={1.5} />
      <h1 className="mt-4 font-display text-3xl">This part is not available to you</h1>
      <p className="mt-2 text-sm text-muted">Your role ({admin.roles.join(', ')}) does not include this area. If you need it, ask the person who manages the portal.</p>
      <Link href={`${ADMIN_PATH}`} className="btn btn-primary mt-6">Back to the start</Link>
    </div>
  );
}
