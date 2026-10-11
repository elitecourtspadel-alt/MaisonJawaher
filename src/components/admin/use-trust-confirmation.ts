'use client';
import { useFeedback } from '@/components/ui/feedback';
import { confirmTrustedDeviceReplacement } from '@/app/(admin)/admin/actions/trusted-devices';

export function useTrustConfirmation() {
  const { confirm, toast } = useFeedback();
  return async (limit?: { name: string; max: number }) => {
    if (!limit) return;
    const approved = await confirm({ title: 'Trusted device limit reached', message: `You can trust ${limit.max} devices. Trusting this browser will remove the least recently used device: ${limit.name}. That device will need a 2FA code on its next sign-in. Continue?`, confirmLabel: 'Replace & trust this device', danger: true });
    if (!approved) { toast({ kind: 'success', title: 'Existing trusted devices kept', message: 'You are signed in. This browser has not been saved as a trusted device.' }); return; }
    try {
      const result = await confirmTrustedDeviceReplacement(true);
      if (!result.ok) toast({ kind: 'error', title: 'Device was not saved', message: result.error });
      else toast({ kind: 'success', title: 'This device is now trusted' });
    } catch { toast({ kind: 'error', title: 'Device was not saved', message: 'Please verify a fresh code and try again.' }); }
  };
}
