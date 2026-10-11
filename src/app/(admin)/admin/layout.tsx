import type { Metadata, Viewport } from 'next';
import '../../globals.css';
import { fontVars } from '@/lib/fonts';
import { Providers } from '@/components/providers';
import { ThemeScript } from '@/components/theme-script';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Maison Jawaher Admin' }, robots: { index: false, follow: false }, icons: { icon: '/favicon-32.png', apple: '/apple-touch-icon.png' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <body><ThemeScript /><Providers>{children}</Providers></body>
    </html>
  );
}
