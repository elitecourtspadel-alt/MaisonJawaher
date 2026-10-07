'use client';
import { ADMIN_PATH } from '@/lib/admin-path';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ExternalLink, Gem, Images, Inbox, LayoutDashboard, LogOut, Megaphone, Menu, MessageCircleQuestion, Package, ScrollText,
  Image as ImageIcon, Settings, ShieldCheck, ShoppingBag, Tags, X, type LucideIcon,
} from 'lucide-react';
import { logoutAction } from '@/app/(admin)/admin/auth-actions';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { LogoMark } from '@/components/site/logo';

/* ───────── what the signed-in admin may do (set once, read anywhere in the portal) ───────── */
type Admin = { name: string; email: string; roles: string[]; can: (code: string) => boolean };
const AdminCtx = createContext<Admin>({ name: '', email: '', roles: [], can: () => false });
export const useAdmin = () => useContext(AdminCtx);

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; need?: string; badge?: 'orders' | 'messages' };
const nav: NavItem[] = [
  { href: `${ADMIN_PATH}`, label: 'Dashboard', icon: LayoutDashboard, exact: true, need: 'dashboard.view' },
  { href: `${ADMIN_PATH}/home-hero`, label: 'Home hero', icon: ImageIcon, need: 'settings.view' },
  { href: `${ADMIN_PATH}/categories`, label: 'Categories', icon: Tags, need: 'categories.view' },
  { href: `${ADMIN_PATH}/products`, label: 'Products', icon: Package, need: 'products.view' },
  { href: `${ADMIN_PATH}/announcements`, label: 'Announcements', icon: Megaphone, need: 'announcements.view' },
  { href: `${ADMIN_PATH}/slides`, label: 'Collection slider', icon: Images, need: 'slides.view' },
  { href: `${ADMIN_PATH}/faqs`, label: 'FAQs', icon: MessageCircleQuestion, need: 'faqs.view' },
  { href: `${ADMIN_PATH}/orders`, label: 'Orders', icon: ShoppingBag, need: 'orders.view', badge: 'orders' },
  { href: `${ADMIN_PATH}/messages`, label: 'Messages', icon: Inbox, need: 'messages.view', badge: 'messages' },
  { href: `${ADMIN_PATH}/audit`, label: 'Audit history', icon: ScrollText, need: 'audit.view' },
  { href: `${ADMIN_PATH}/settings`, label: 'Settings', icon: Settings, need: 'settings.view' },
  { href: `${ADMIN_PATH}/security`, label: 'Security & 2FA', icon: ShieldCheck },
];

export function AdminShell({ admin, privileges, badges, testMode, children }: {
  admin: { name: string; email: string; roles: string[] }; privileges: string[]; badges: { orders: number; messages: number }; testMode: boolean; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hover, setHover] = useState(false); // desktop rail opens on hover / focus and closes when the pointer leaves
  const [drawer, setDrawer] = useState(false);
  const leave = useRef<ReturnType<typeof setTimeout>>(undefined);

  const ctx = useMemo<Admin>(() => ({ ...admin, can: (c) => privileges.includes(c) }), [admin, privileges]);
  const items = nav.filter((n) => !n.need || ctx.can(n.need));

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => { document.body.style.overflow = drawer ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [drawer]);

  const signOut = async () => { await logoutAction(); router.replace(`${ADMIN_PATH}/login`); router.refresh(); };
  const active = (n: NavItem) => (n.exact ? pathname === n.href : pathname.startsWith(n.href));

  const links = (expanded: boolean, scope: string) => (
    <ul className="grid gap-0.5">
      {items.map((n) => {
        const on = active(n);
        const count = n.badge ? badges[n.badge] : 0;
        return (
          <li key={n.href}>
            <Link href={n.href} aria-label={n.label} aria-current={on ? 'page' : undefined}
              className={`group relative flex h-11 items-center gap-4 rounded-2xl px-[0.95rem] text-sm transition-colors [@media(max-height:700px)]:h-10 ${on ? 'text-brand-fg' : 'text-fg/80 hover:bg-accent/15 hover:text-fg'}`}>
              {on && <motion.span layoutId={`nav-active-${scope}`} className="absolute inset-0 rounded-2xl bg-brand" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className="relative shrink-0">
                <n.icon className="size-[1.3rem]" strokeWidth={1.6} />
                {count > 0 && !expanded && <i className="absolute -right-1 -top-1 size-2.5 rounded-full bg-accent ring-2 ring-surface" />}
              </span>
              <span className={`relative flex-1 whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>{n.label}</span>
              {count > 0 && expanded && <span className="relative rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-semibold text-[#2a1519]">{count}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const bottom = (expanded: boolean) => (
    <div className="mt-2 grid gap-0.5 border-t border-line pt-2">
      <a href="/" target="_blank" rel="noopener" aria-label="View website" className="flex h-11 items-center gap-4 rounded-2xl px-[0.95rem] text-sm text-fg/80 hover:bg-accent/15 [@media(max-height:700px)]:h-10">
        <ExternalLink className="size-[1.3rem] shrink-0" strokeWidth={1.6} /><span className={`whitespace-nowrap transition-opacity ${expanded ? 'opacity-100' : 'opacity-0'}`}>View website</span>
      </a>
      <button onClick={signOut} aria-label="Sign out" className="flex h-11 items-center gap-4 rounded-2xl px-[0.95rem] text-sm text-fg/80 hover:bg-danger/15 hover:text-danger [@media(max-height:700px)]:h-10">
        <LogOut className="size-[1.3rem] shrink-0" strokeWidth={1.6} /><span className={`whitespace-nowrap transition-opacity ${expanded ? 'opacity-100' : 'opacity-0'}`}>Sign out</span>
      </button>
    </div>
  );

  return (
    <AdminCtx.Provider value={ctx}>
      <div className="min-h-dvh lg:pl-[5.25rem]">
        {/* desktop rail: everything lives in one scrolling column so the last item can always be reached */}
        <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-line bg-surface transition-[width,box-shadow] duration-300 lg:flex ${hover ? 'w-64 shadow-2xl' : 'w-[5.25rem]'}`}
          onPointerEnter={(e) => { if (e.pointerType === 'mouse') { clearTimeout(leave.current); setHover(true); } }}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') { clearTimeout(leave.current); leave.current = setTimeout(() => setHover(false), 140); } }}
          onFocusCapture={() => setHover(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(false); }}>
          <nav aria-label="Admin" className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
            <div className="mb-3 flex h-14 items-center gap-3 overflow-hidden px-1.5 text-brand dark:text-accent [@media(max-height:700px)]:mb-1 [@media(max-height:700px)]:h-12">
              <LogoMark className="h-11 shrink-0 [@media(max-height:700px)]:h-9" />
              <span className={`font-display text-xl uppercase tracking-[0.14em] text-fg transition-opacity ${hover ? 'opacity-100' : 'opacity-0'}`}>Jawaher</span>
            </div>
            {links(hover, 'rail')}
            {bottom(hover)}
          </nav>
        </aside>

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-8">
          <button aria-label="Open menu" onClick={() => setDrawer(true)} className="grid size-11 place-items-center rounded-full hover:bg-accent/15 lg:hidden"><Menu className="size-5" /></button>
          <div className="hidden items-center gap-2 font-display text-lg lg:flex"><Gem className="size-4 text-accent" strokeWidth={1.6} />Maison Jawaher · Admin</div>
          <div className="flex items-center gap-2">
            {testMode && <span title="Running without Supabase: data is stored in the .data folder" className="rounded-full bg-accent/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-accent">Test mode</span>}
            <span className="hidden max-w-64 truncate text-right text-sm leading-tight text-muted sm:block"><b className="block font-medium text-fg">{admin.name}</b><span className="text-xs">{admin.roles.join(', ')}</span></span>
            <ThemeToggle />
          </div>
        </header>

        <AnimatePresence>
          {drawer && (
            <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-[#12060a]/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
              <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="mb-3 flex items-center justify-between px-2 pt-1 text-brand dark:text-accent">
                  <LogoMark className="h-12" />
                  <button aria-label="Close menu" onClick={() => setDrawer(false)} className="grid size-10 place-items-center rounded-full text-fg hover:bg-accent/15"><X className="size-5" /></button>
                </div>
                <nav aria-label="Admin" className="flex-1">{links(true, 'drawer')}{bottom(true)}</nav>
                <p className="mt-3 px-3 text-xs text-muted">{admin.name} · {admin.roles.join(', ')}</p>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </AdminCtx.Provider>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-display text-3xl sm:text-4xl">{title}</h1>{description && <p className="mt-1 max-w-xl text-sm text-muted">{description}</p>}</div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}
