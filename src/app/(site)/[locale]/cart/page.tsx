import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDict, isLocale } from '@/lib/i18n';
import { CartView } from '@/components/site/cart-view';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? getDict(locale).cart.title : 'Cart', robots: { index: false } };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="container-x py-12 sm:py-16">
      <h1 className="section-title mb-10 text-center">{getDict(locale).cart.title}</h1>
      <CartView />
    </div>
  );
}
