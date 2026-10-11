import Link from 'next/link';
import { headers } from 'next/headers';
import { defaultLocale, getDict, isLocale } from '@/lib/i18n';

export default async function NotFound() {
  const h = await headers();
  const seg = (h.get('x-pathname') ?? '').split('/')[1];
  const locale = isLocale(seg) ? seg : defaultLocale;
  const t = getDict(locale);
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="gold-text font-display text-8xl">404</p>
        <h1 className="mt-4 font-display text-4xl">{t.notFound.title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">{t.notFound.body}</p>
        <Link href={`/${locale}`} className="btn btn-primary mt-8">{t.notFound.cta}</Link>
      </div>
    </div>
  );
}
