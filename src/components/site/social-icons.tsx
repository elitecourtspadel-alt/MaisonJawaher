import type { CSSProperties, SVGProps } from 'react';
import { siInstagram, siFacebook, siTiktok, siWhatsapp, siPinterest, siYoutube, siX, siSnapchat, siThreads } from 'simple-icons';
import type { SocialLink } from '@/lib/types';

type Brand = { path: string; hex: string };
const make = (b: Brand) => function BrandIcon(props: SVGProps<SVGSVGElement>) {
  return <svg role="img" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d={b.path} /></svg>;
};

/** Official brand glyphs from the Simple Icons set, with each brand's own colour on hover. */
export const socialMeta: Record<string, { Icon: ReturnType<typeof make>; label: string; hover: string; ink: string }> = {
  instagram: { Icon: make(siInstagram), label: 'Instagram', hover: 'linear-gradient(45deg,#feda75 0%,#fa7e1e 25%,#d62976 50%,#962fbf 75%,#4f5bd5 100%)', ink: '#fff' },
  facebook: { Icon: make(siFacebook), label: 'Facebook', hover: `#${siFacebook.hex}`, ink: '#fff' },
  tiktok: { Icon: make(siTiktok), label: 'TikTok', hover: '#000', ink: '#fff' },
  whatsapp: { Icon: make(siWhatsapp), label: 'WhatsApp', hover: `#${siWhatsapp.hex}`, ink: '#fff' },
  pinterest: { Icon: make(siPinterest), label: 'Pinterest', hover: `#${siPinterest.hex}`, ink: '#fff' },
  youtube: { Icon: make(siYoutube), label: 'YouTube', hover: `#${siYoutube.hex}`, ink: '#fff' },
  x: { Icon: make(siX), label: 'X', hover: '#000', ink: '#fff' },
  snapchat: { Icon: make(siSnapchat), label: 'Snapchat', hover: `#${siSnapchat.hex}`, ink: '#000' },
  threads: { Icon: make(siThreads), label: 'Threads', hover: '#000', ink: '#fff' },
};

export function SocialIcons({ links, className = '', size = 'md' }: { links: SocialLink[]; className?: string; size?: 'md' | 'sm' }) {
  const active = links.filter((l) => l.enabled && l.url && socialMeta[l.platform]);
  if (!active.length) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {active.map((l) => {
        const m = socialMeta[l.platform];
        return (
          <li key={l.platform}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`${m.label} (opens in a new tab)`} title={m.label}
              style={{ '--hv': m.hover, '--ink': m.ink } as CSSProperties}
              className={`group grid ${size === 'sm' ? 'size-10' : 'size-11'} place-items-center rounded-full border border-current/25 transition duration-300 hover:-translate-y-1 hover:border-transparent hover:text-[var(--ink)] hover:shadow-lg hover:[background:var(--hv)] focus-visible:-translate-y-1 focus-visible:border-transparent focus-visible:text-[var(--ink)] focus-visible:[background:var(--hv)]`}>
              <m.Icon className="size-[1.15rem]" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
