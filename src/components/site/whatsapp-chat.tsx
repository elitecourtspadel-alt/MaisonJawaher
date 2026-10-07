'use client';
import { useSite } from '@/components/site-context';
import { socialMeta } from './social-icons';

/** Floating "chat with us" button, bottom-left. Opens a WhatsApp chat with the shop number. */
export function WhatsAppChat() {
  const { settings, t } = useSite();
  const W = socialMeta.whatsapp.Icon;
  const number = settings.whatsapp_number.replace(/\D/g, '');
  if (!number) return null;
  return (
    <a href={`https://wa.me/${number}?text=${encodeURIComponent(t.whatsapp.hello)}`} target="_blank" rel="noopener noreferrer" aria-label={t.whatsapp.chat}
      className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-40 flex h-14 items-center overflow-hidden rounded-full bg-[var(--wa)] pl-[0.9rem] pr-[0.9rem] text-white shadow-xl transition-all duration-500 hover:bg-[var(--wa-dark)] hover:pr-5 focus-visible:pr-5"
      style={{ animation: 'pulse-ring 2.6s infinite' }}>
      <W className="size-7 shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-500 group-hover:ml-3 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:ml-3 group-focus-visible:max-w-40 group-focus-visible:opacity-100">{t.whatsapp.chatShort}</span>
    </a>
  );
}
