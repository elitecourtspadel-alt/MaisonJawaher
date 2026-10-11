import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getProducts } from '@/lib/data';
import { getDict, isLocale, loc } from '@/lib/i18n';
import { ShopView } from '@/components/site/shop-view';

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ category?: string }> };

export async function generateMetadata({ params, searchParams }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { category } = await searchParams;
  const t = getDict(locale);
  const cat = category ? (await getCategories()).find((c) => c.slug === category) : undefined;
  const title = cat ? loc(cat, 'seo_title', locale) || loc(cat, 'name', locale) : t.shop.title;
  const description = (cat && (loc(cat, 'seo_description', locale) || loc(cat, 'description', locale))) || t.shop.subtitle;
  // /shop?category=rings is its own indexable page; the unfiltered shop is the canonical entry
  const canonical = cat ? `/${locale}/shop?category=${cat.slug}` : `/${locale}/shop`;
  const og = { locale: locale === 'fr' ? 'fr_MA' : 'en_US', siteName: 'Maison Jawaher', title, description, url: canonical, images: cat?.image_url ? [{ url: cat.image_url, alt: title }] : undefined };
  return { title, description, openGraph: og, alternates: { canonical, languages: { en: cat ? `/en/shop?category=${cat.slug}` : '/en/shop', fr: cat ? `/fr/shop?category=${cat.slug}` : '/fr/shop' } } };
}

export default async function Shop({ params, searchParams }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const cat = category ? categories.find((c) => c.slug === category) : undefined;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const t = getDict(locale);
  const name = cat ? loc(cat, 'name', locale) : t.shop.title;
  const page = cat ? `${base}/${locale}/shop?category=${cat.slug}` : `${base}/${locale}/shop`;
  const listed = (cat ? products.filter((p) => p.categories?.slug === cat.slug) : products).slice(0, 50);
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name, url: page, inLanguage: locale, description: cat ? loc(cat, 'description', locale) || undefined : t.shop.subtitle,
      mainEntity: { '@type': 'ItemList', itemListElement: listed.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}/${locale}/product/${p.slug}`, name: loc(p, 'name', locale) })) } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: t.product.home, url: `${base}/${locale}` }, { name: t.shop.title, url: `${base}/${locale}/shop` }, ...(cat ? [{ name, url: page }] : [])].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) },
  ];
  return (
    <div className="container-x py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ShopView products={products} categories={categories} />
    </div>
  );
}
