'use client';
import { usePathname } from 'next/navigation';
import { Gem, Megaphone } from 'lucide-react';
import { useSite } from '@/components/site-context';

/** Shared announcements, placed below the brand hero on the homepage. */
export function AnnouncementMarquee({ placement = 'header' }: { placement?: 'header' | 'home' }) {
  const { announcements, t, path } = useSite();
  const pathname = usePathname();
  const isHome = pathname?.replace(/\/$/, '') === path('/');
  if (!announcements.length || (placement === 'header' && isHome)) return null;
  const chars = announcements.reduce((n, a) => n + a.message.length, 0);
  const seconds = Math.max(24, Math.round(chars * 0.32));
  const list = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {announcements.map((a) => (
        <li key={a.id} className="flex items-center whitespace-nowrap px-5 font-display text-[1.05rem] italic tracking-wide text-[#f7ecdd] sm:text-[1.15rem]">
          {a.message}
          <span aria-hidden className="ml-8 inline-flex items-center gap-3 text-[#e9c887] sm:ml-10">
            <span className="h-px w-5 bg-current opacity-40" />
            <Gem className="marquee-gem size-4" strokeWidth={1.2} />
            <span className="h-px w-5 bg-current opacity-40" />
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={placement === 'home' ? 'home-announcements' : 'px-3 pt-2 sm:px-6'} role="region" aria-label={t.nav.announcements}>
      <div className={`marquee marquee-lux mx-auto flex items-center overflow-hidden ${placement === 'home' ? 'min-h-14 py-2.5' : 'max-w-6xl rounded-full py-1.5 pl-2'}`} style={{ ['--marquee-duration' as string]: `${seconds}s` }}>
        {placement === 'header' && <span className="relative z-10 mr-1 grid size-7 shrink-0 place-items-center rounded-full bg-[#e9c887] text-[#3c0b1e]"><Megaphone className="size-3.5" strokeWidth={1.8} /></span>}
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_2.5rem,#000_calc(100%-2.5rem),transparent)]">
          <div className="marquee-track">{list(false)}{list(true)}{list(true)}{list(true)}</div>
        </div>
      </div>
    </div>
  );
}
