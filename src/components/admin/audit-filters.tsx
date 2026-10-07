'use client';
import { ADMIN_PATH } from '@/lib/admin-path';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Select } from '@/components/ui/floating';

const AREAS = [
  { value: '', label: 'Everything' }, { value: 'product', label: 'Products' }, { value: 'category', label: 'Categories' }, { value: 'hero slide', label: 'Collection slides' },
  { value: 'announcement', label: 'Announcements' }, { value: 'question', label: 'FAQs' }, { value: 'order', label: 'Orders' }, { value: 'message', label: 'Messages' },
  { value: 'setting', label: 'Settings' }, { value: 'account', label: 'Sign-ins and security' },
];
const SORTS = [{ value: 'new', label: 'Newest to oldest' }, { value: 'old', label: 'Oldest to newest' }];

export function AuditFilters({ q, area, sort }: { q: string; area: string; sort: string }) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const [a, setA] = useState(area);
  const [o, setO] = useState(sort);
  // Any change goes back to page 1 of the new result
  const go = (next: { text?: string; area?: string; sort?: string }) => {
    const t = next.text ?? text, ar = next.area ?? a, so = next.sort ?? o;
    router.push(`${ADMIN_PATH}/audit?${new URLSearchParams({ ...(t ? { q: t } : {}), ...(ar ? { area: ar } : {}), ...(so === 'old' ? { sort: so } : {}) })}`);
  };
  return (
    <form method="post" onSubmit={(e) => { e.preventDefault(); go({ text: text.trim() }); }} className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_13rem_13rem_auto]">
      <label className="relative block sm:col-span-2 lg:col-span-1">
        <span className="sr-only">Search the history</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input type="search" className="input pl-11" placeholder="Search, for example a product name" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <Select value={a} onChange={(v) => { setA(v); go({ area: v }); }} options={AREAS} label="Area" hideLabel />
      <Select value={o} onChange={(v) => { setO(v); go({ sort: v }); }} options={SORTS} label="Sort by date" hideLabel />
      <button className="btn btn-primary sm:col-span-2 lg:col-span-1">Search</button>
    </form>
  );
}
