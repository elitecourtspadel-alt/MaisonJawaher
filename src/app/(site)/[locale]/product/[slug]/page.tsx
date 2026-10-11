import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct, getProducts } from '@/lib/data';
import { getDict, isLocale, loc } from '@/lib/i18n';
import { getSettings } from '@/lib/settings';
import { ProductDetail } from '@/components/site/product-detail';
import { ProductCard } from '@/components/site/product-card';

type P = { params: Promise<{ locale: string; slug: string }> };
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProduct(slug);
  if (!p || !isLocale(locale)) return { title: getDict(isLocale(locale) ? locale : 'en').product.notFound, robots: { index: false } };
  const name = loc(p, 'name', locale);
  const title = loc(p, 'seo_title', locale) || name;
  const description = loc(p, 'seo_description', locale) || loc(p, 'short_description', locale) || loc(p, 'description', locale).slice(0, 160);
  const img = p.product_images?.[0]?.url;
  return {
    title, description,
    openGraph: { locale: locale === 'fr' ? 'fr_MA' : 'en_US', siteName: 'Maison Jawaher', title, description, type: 'website', url: `/${locale}/product/${slug}`, images: img ? [{ url: img, alt: name }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: img ? [img] : undefined },
    alternates: { canonical: `/${locale}/product/${slug}`, languages: { en: `/en/product/${slug}`, fr: `/fr/product/${slug}`, 'x-default': `/fr/product/${slug}` } },
  };
}

export default async function ProductPage({ params }: P) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const p = await getProduct(slug);
  if (!p) notFound();
  const t = getDict(locale);
  const settings = await getSettings();
  const related = (await getProducts({ category: p.categories?.slug })).filter((x) => x.id !== p.id).slice(0, 4);
  const name = loc(p, 'name', locale);
  const base = `${siteUrl()}/${locale}`;

  const crumbs = [
    { name: t.product.home, url: base },
    { name: t.shop.title, url: `${base}/shop` },
    ...(p.categories ? [{ name: loc(p.categories, 'name', locale), url: `${base}/shop?category=${p.categories.slug}` }] : []),
    { name, url: `${base}/product/${p.slug}` },
  ];
  const showPrice = settings.show_prices && p.show_price && p.price != null;
  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'Product', name, description: loc(p, 'description', locale) || loc(p, 'short_description', locale),
      sku: p.sku || undefined, material: loc(p, 'material', locale) || undefined, brand: { '@type': 'Brand', name: 'Maison Jawaher' },
      image: p.product_images?.map((i) => (i.url.startsWith('http') ? i.url : `${siteUrl()}${i.url}`)), url: `${base}/product/${p.slug}`,
      ...(showPrice ? { offers: { '@type': 'Offer', price: p.price, priceCurrency: settings.currency, url: `${base}/product/${p.slug}`, availability: p.track_stock && p.stock <= 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' } } : {}),
    },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ProductDetail product={p} hasRelated={related.length > 0} crumbs={crumbs.map((c) => ({ name: c.name, href: c.url.replace(siteUrl(), '') }))}>
        {related.length > 0 && (
          <section id="related" className="mt-16 sm:mt-24">
            <h2 className="section-title mb-8 !text-3xl">{t.product.related}</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
          </section>
        )}
      </ProductDetail>
    </>
  );
}
