import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { defaultLocale, isLocale, localeForCountry } from '@/lib/i18n';
import { isTestMode } from '@/lib/mode';
import { ADMIN_PATH } from '@/lib/admin-path';

/** Headers set by the host or CDN with the visitor's country, in the order we trust them. */
const COUNTRY_HEADERS = ['x-vercel-ip-country', 'cf-ipcountry', 'cloudfront-viewer-country', 'x-country-code', 'x-appengine-country', 'x-geo-country'];

/**
 * Which language a visitor without a /fr or /en address gets:
 *   1. the language they picked themselves in the header (cookie), always;
 *   2. otherwise by country: French for Morocco and French-speaking countries, English for everywhere else;
 *   3. if the country is unknown (local development, no CDN), the browser language, then the default.
 */
function preferredLocale(req: NextRequest) {
  const cookie = req.cookies.get('mj-locale')?.value;
  if (isLocale(cookie)) return cookie;
  for (const h of COUNTRY_HEADERS) {
    const l = localeForCountry(req.headers.get(h));
    if (l) return l;
  }
  const accept = req.headers.get('accept-language')?.toLowerCase() ?? '';
  const first = accept.split(',').map((p) => p.trim().slice(0, 2)).find((l) => l === 'en' || l === 'fr');
  return first ?? defaultLocale;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The portal's real folder is /admin, but it is only reachable at the private ADMIN_PATH. The plain /admin does not exist for visitors.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } });
  }

  // Admin: refresh the Supabase session cookies
  if (pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`)) {
    const internal = req.nextUrl.clone();
    internal.pathname = `/admin${pathname.slice(ADMIN_PATH.length)}`;
    let res = NextResponse.rewrite(internal, { request: req });
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !isTestMode()) {
      try {
      const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(8000) }) },
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (list) => {
            list.forEach(({ name, value }) => req.cookies.set(name, value));
            res = NextResponse.rewrite(internal, { request: req });
            list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
          },
        },
      });
      await sb.auth.getUser();
      } catch {
        // The login page explains connection problems; protected pages still require a verified session.
        console.warn('[auth] The sign-in service is currently unavailable.');
      }
    }
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // Public: ensure a locale prefix
  const hasLocale = pathname.split('/')[1] && isLocale(pathname.split('/')[1]);
  if (!hasLocale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale(req)}${pathname === '/' ? '' : pathname}`;
    const res = NextResponse.redirect(url);
    res.headers.set('Cache-Control', 'private, no-store'); // the answer depends on the visitor's country and cookie
    return res;
  }
  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
