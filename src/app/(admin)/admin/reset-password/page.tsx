import { ADMIN_PATH } from '@/lib/admin-path';
import { redirect } from 'next/navigation';
import { readRecovery } from '@/lib/password-recovery';
import { ResetPasswordForm } from '@/components/admin/reset-password-form';
export const dynamic = 'force-dynamic';
export default async function ResetPasswordPage() {
  if (!await readRecovery()) redirect(`${ADMIN_PATH}/login`);
  return <ResetPasswordForm />;
}
