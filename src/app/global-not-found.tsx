import './globals.css';
import Link from 'next/link';
import { fontVars } from '@/lib/fonts';

export const metadata = { title: 'Page not found · Maison Jawaher' };

export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVars}>
      <body>
        <div className="grid min-h-dvh place-items-center p-6 text-center">
          <div>
            <p className="gold-text font-display text-8xl">404</p>
            <h1 className="mt-4 font-display text-4xl">Page not found</h1>
            <Link href="/" className="btn btn-primary mt-8">Back to home</Link>
          </div>
        </div>
      </body>
    </html>
  );
}
