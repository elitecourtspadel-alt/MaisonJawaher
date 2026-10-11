'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Laptop, Trash2 } from 'lucide-react';
import { FormSection } from '@/components/ui/field';
import { useFeedback } from '@/components/ui/feedback';
import { revokeTrustedDevice } from '@/app/(admin)/admin/actions/trusted-devices';

export function TrustedDevicesPanel({ devices, enabled, days, max }: { devices: { id: string; name: string; current: boolean; lastUsed: string; expiresAt: string }[]; enabled: boolean; days: number; max: number }) {
  const router = useRouter(), { toast, confirm } = useFeedback();
  const [busy, setBusy] = useState(false);
  const remove = async (id?: string) => {
    if (!await confirm({ title: id ? 'Remove this trusted device?' : 'Remove all trusted devices?', message: 'The affected browsers will need a 2FA code again. Password sign-in is always required.', confirmLabel: 'Remove', danger: true })) return;
    setBusy(true);
    try {
      const result = await revokeTrustedDevice(id);
      if (!result.ok) toast({ kind: 'error', title: 'Device could not be removed', message: result.error });
      else { toast({ kind: 'success', title: 'Device trust removed' }); router.refresh(); }
    } catch { toast({ kind: 'error', title: 'Please try again' }); }
    finally { setBusy(false); }
  };
  return <FormSection title="Your trusted devices" description={enabled ? `Remember a private browser for up to ${days} days. You can trust ${max} browsers; adding another requires your confirmation to replace the least recently used device. Trust does not extend your sign-in session.` : 'Trusted devices are disabled in Settings. All sign-ins require a 2FA code when 2FA is enabled.'}>
    {!devices.length && <p className="text-sm text-muted">No trusted devices. Choose “Trust this device” after entering a valid authenticator code.</p>}
    {devices.map((device) => <div key={device.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line p-4">
      <div className="flex gap-3"><Laptop className="size-5 text-accent" /><div><p className="font-medium">{device.name}{device.current && <span className="ml-2 text-xs text-accent">This browser</span>}</p><p className="mt-1 text-xs text-muted">Last used {new Date(device.lastUsed).toUTCString()}<br />Expires {new Date(device.expiresAt).toUTCString()}</p></div></div>
      <button className="btn btn-outline" disabled={busy} onClick={() => remove(device.id)}><Trash2 className="size-4" />Remove</button>
    </div>)}
    {!!devices.length && <button className="btn btn-outline justify-self-start" disabled={busy} onClick={() => remove()}>Remove all trusted devices</button>}
  </FormSection>;
}
