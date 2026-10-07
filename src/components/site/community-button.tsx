'use client';
import { useSite } from '@/components/site-context';
import { socialMeta } from './social-icons';

/** "Join our WhatsApp community": official green button with the WhatsApp glyph. Hidden when no invite link is set. */
export function CommunityLink({ className = '' }: { className?: string }) {
  const { settings, t } = useSite();
  const W = socialMeta.whatsapp.Icon;
  if (!settings.show_community_button || !settings.whatsapp_community_url) return null;
  return (
    <a href={settings.whatsapp_community_url} target="_blank" rel="noopener noreferrer" className={`btn btn-wa ${className}`}>
      <W className="size-5" />{t.community.cta}
    </a>
  );
}

/** A short card with the invitation. `tone="wine"` is for use on a wine background (the footer). */
export function CommunityCard({ tone = 'light' }: { tone?: 'light' | 'wine' }) {
  const { settings, t, locale } = useSite();
  const W = socialMeta.whatsapp.Icon;
  if (!settings.show_community_button || !settings.whatsapp_community_url) return null;
  const title = settings.community_title?.[locale]?.trim() || t.community.title;
  const message = settings.community_message?.[locale]?.trim() || t.community.body;
  const wine = tone === 'wine';
  return (
    <div className={`flex flex-col gap-5 rounded-3xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7 ${wine ? 'border-white/15 bg-white/[0.06] backdrop-blur' : 'border-line bg-surface'}`}>
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--wa)] text-white"><W className="size-6" /></span>
        <div>
          <h2 className="font-display text-2xl leading-tight">{title}</h2>
          <p className={`mt-1 text-sm ${wine ? 'text-white/70' : 'text-muted'}`}>{message}</p>
        </div>
      </div>
      <CommunityLink className="shrink-0" />
    </div>
  );
}
