import type { MetadataRoute } from 'next';
import { ADMIN_PATH } from '@/lib/admin-path';

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return {
    // The portal's address is deliberately not listed here (robots.txt is public). Its pages send noindex headers instead.
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/en/cart', '/fr/cart'] },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
