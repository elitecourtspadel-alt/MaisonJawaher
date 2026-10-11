'use client';
import { useEffect, useState } from 'react';

/** Spam trap: invisible `website` field humans never fill + a render timestamp (bots submit instantly). */
export function Honeypot({ locale }: { locale: string }) {
  const [ts, setTs] = useState('');
  useEffect(() => setTs(String(Date.now())), []);
  return (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="_ts" value={ts} />
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Leave this empty<input type="text" name="contact_alt" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>
    </>
  );
}
