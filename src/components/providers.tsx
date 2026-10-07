'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FeedbackProvider } from '@/components/ui/feedback';

/**
 * Light / dark / system colour mode. The tiny script that applies the saved choice before the first paint lives in
 * theme-script.tsx (a server component); this provider only keeps React in step with it. It deliberately renders no
 * <script> itself: React 19 logs an error when a client component creates one while the page is navigating.
 */
export type Theme = 'light' | 'dark' | 'system';
type ThemeCtx = { theme: Theme; resolvedTheme: 'light' | 'dark'; setTheme: (t: Theme) => void };
const Ctx = createContext<ThemeCtx>({ theme: 'system', resolvedTheme: 'light', setTheme: () => {} });
export const useTheme = () => useContext(Ctx);

export const THEME_KEY = 'mj-theme';
const query = () => window.matchMedia('(prefers-color-scheme: dark)');
const resolve = (t: Theme): 'light' | 'dark' => (t === 'system' ? (query().matches ? 'dark' : 'light') : t);

function apply(r: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', r === 'dark');
  root.style.colorScheme = r;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolved] = useState<'light' | 'dark'>('light');

  const sync = useCallback((t: Theme) => { const r = resolve(t); setResolved(r); apply(r); }, []);

  useEffect(() => {
    let saved: Theme = 'system';
    try { const v = localStorage.getItem(THEME_KEY); if (v === 'light' || v === 'dark' || v === 'system') saved = v; } catch { /* storage blocked */ }
    setThemeState(saved);
    sync(saved);
    const mq = query();
    const onSystem = () => setThemeState((t) => { if (t === 'system') sync('system'); return t; });
    const onStorage = (e: StorageEvent) => { if (e.key === THEME_KEY && (e.newValue === 'light' || e.newValue === 'dark' || e.newValue === 'system')) { setThemeState(e.newValue); sync(e.newValue); } };
    mq.addEventListener('change', onSystem);
    window.addEventListener('storage', onStorage);
    return () => { mq.removeEventListener('change', onSystem); window.removeEventListener('storage', onStorage); };
  }, [sync]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    sync(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode */ }
  }, [sync]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <FeedbackProvider>{children}</FeedbackProvider>
    </ThemeProvider>
  );
}
