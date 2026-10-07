'use client';
import { useEffect, useState } from 'react';
import { useTheme, type Theme } from '@/components/providers';
import { Monitor, Moon, Sun } from 'lucide-react';
import { FloatingMenu, MenuItem } from '@/components/ui/floating';

const labels = {
  en: { light: 'Light', dark: 'Dark', system: 'System', label: 'Theme' },
  fr: { light: 'Clair', dark: 'Sombre', system: 'Système', label: 'Thème' },
};

export function ThemeToggle({ locale = 'en' }: { locale?: 'en' | 'fr' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const t = labels[locale];
  const Icon = !mounted ? Sun : theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
  const opts: { v: Theme; Icon: typeof Sun; l: string }[] = [{ v: 'light', Icon: Sun, l: t.light }, { v: 'dark', Icon: Moon, l: t.dark }, { v: 'system', Icon: Monitor, l: t.system }];
  return (
    <FloatingMenu trigger={({ props }) => (
      <button type="button" aria-label={t.label} {...props} className="grid size-11 place-items-center rounded-full transition hover:bg-accent/15 hover:text-accent">
        <Icon className="size-[1.15rem]" />
      </button>
    )}>
      {(close) => opts.map((o) => (
        <MenuItem key={o.v} active={mounted && theme === o.v} onClick={() => { setTheme(o.v); close(); }}>
          <span className="flex items-center gap-2.5"><o.Icon className="size-4" />{o.l}</span>
        </MenuItem>
      ))}
    </FloatingMenu>
  );
}
