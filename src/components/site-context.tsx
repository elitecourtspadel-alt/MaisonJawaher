'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';
import type { Dict } from '@/messages/en';
import type { SiteSettings, OrderItem } from '@/lib/types';
import { formatPrice, text as pickText } from '@/lib/i18n';

/** Categories, as needed for links (the footer lists them). */
export type NavCategory = { slug: string; name: string };
export type NavAnnouncement = { id: string; message: string };

type Site = {
  locale: Locale; t: Dict; settings: SiteSettings; categories: NavCategory[]; announcements: NavAnnouncement[];
  price: (v: number | null | undefined) => string; path: (p?: string) => string; address: string;
};
const SiteCtx = createContext<Site | null>(null);
export const useSite = () => {
  const c = useContext(SiteCtx);
  if (!c) throw new Error('SiteProvider missing');
  return c;
};

export function SiteProvider({ locale, t, settings, categories, announcements, children }: {
  locale: Locale; t: Dict; settings: SiteSettings; categories: NavCategory[]; announcements: NavAnnouncement[]; children: ReactNode;
}) {
  const value = useMemo<Site>(() => ({
    locale, t, settings, categories, announcements,
    price: (v) => formatPrice(v, locale, settings.currency),
    path: (p = '') => `/${locale}${p === '/' ? '' : p}`,
    address: pickText(settings.address, locale),
  }), [locale, t, settings, categories, announcements]);
  return (
    <SiteCtx.Provider value={value}>
      <CartProvider>{children}</CartProvider>
    </SiteCtx.Provider>
  );
}

/* ───────── cart (localStorage) ───────── */
type CartCtx = { items: OrderItem[]; count: number; add: (i: Omit<OrderItem, 'qty'>, qty?: number) => void; setQty: (id: string, qty: number) => void; remove: (id: string) => void; clear: () => void; ready: boolean };
const CartC = createContext<CartCtx | null>(null);
export const useCart = () => {
  const c = useContext(CartC);
  if (!c) throw new Error('CartProvider missing');
  return c;
};
const KEY = 'mj-cart-v1';

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { /* ignore */ }
    setReady(true);
    const sync = (e: StorageEvent) => { if (e.key === KEY) try { setItems(JSON.parse(e.newValue || '[]')); } catch { /* ignore */ } };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode */ } }, [items, ready]);

  const add = useCallback<CartCtx['add']>((i, qty = 1) => setItems((l) => {
    const ex = l.find((x) => x.id === i.id);
    return ex ? l.map((x) => (x.id === i.id ? { ...x, qty: Math.min(20, x.qty + qty) } : x)) : [...l, { ...i, qty }];
  }), []);
  const setQty = useCallback<CartCtx['setQty']>((id, qty) => setItems((l) => l.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x))), []);
  const remove = useCallback((id: string) => setItems((l) => l.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({ items, count: items.reduce((n, i) => n + i.qty, 0), add, setQty, remove, clear, ready }), [items, add, setQty, remove, clear, ready]);
  return <CartC.Provider value={value}>{children}</CartC.Provider>;
}
