'use client';
import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import type { Language } from '@/lib/types';
import { Field, FieldError, TextArea } from '@/components/ui/field';

export type TrValue = Record<string, Record<string, string>>;
export type FieldDef = { key: string; label: string; kind?: 'input' | 'textarea'; rows?: number; hint?: string; placeholder?: string; required?: boolean };

/** One tab per language; each tab shows the same fields. A dot marks languages that have no wording yet. */
export function LangFields({ languages, fields, value, onChange, errors = {}, compact = false }: {
  languages: Language[]; fields: FieldDef[]; value: TrValue; onChange: (locale: string, field: string, v: string) => void; errors?: Record<string, string>; compact?: boolean;
}) {
  const [tab, setTab] = useState(languages[0]?.code ?? '');
  const firstError = Object.keys(errors).find((k) => k.includes('.'))?.split('.')[0];
  useEffect(() => { if (firstError && languages.some((l) => l.code === firstError)) setTab(firstError); }, [firstError, languages]);

  const filled = (code: string) => fields.some((f) => (value[code]?.[f.key] ?? '').trim());
  return (
    <div>
      {languages.length > 1 && (
        <div role="tablist" aria-label="Language" className="mb-4 inline-flex max-w-full flex-wrap gap-1 rounded-full border border-line bg-surface-2/60 p-1">
          {languages.map((l) => {
            const hasError = Object.keys(errors).some((k) => k.startsWith(`${l.code}.`));
            return (
              <button key={l.code} type="button" role="tab" aria-selected={tab === l.code} onClick={() => setTab(l.code)}
                className={`relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${tab === l.code ? 'bg-brand text-brand-fg shadow' : 'hover:text-accent'}`}>
                <Languages className="size-3.5" strokeWidth={1.6} />{l.native_name}
                {l.is_default && <span className="text-[0.6rem] uppercase tracking-wider opacity-70">main</span>}
                {hasError ? <i className="size-2 rounded-full bg-danger" aria-label="Needs attention" /> : !filled(l.code) && <i className="size-2 rounded-full bg-accent" title="Not written yet" aria-label="Not written yet" />}
              </button>
            );
          })}
        </div>
      )}
      {languages.map((l) => (
        <div key={l.code} role="tabpanel" hidden={tab !== l.code} className={`grid gap-4 ${compact ? 'sm:grid-cols-2' : ''}`}>
          {fields.map((f) => {
            const common = { label: f.label, value: value[l.code]?.[f.key] ?? '', hint: f.hint, placeholder: f.placeholder, required: f.required && l.is_default, error: errors[`${l.code}.${f.key}`], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(l.code, f.key, e.target.value), lang: l.code, dir: l.direction };
            return f.kind === 'textarea' ? <TextArea key={f.key} rows={f.rows ?? 3} {...common} /> : <Field key={f.key} {...common} />;
          })}
        </div>
      ))}
      {errors._ && <FieldError message={errors._} />}
    </div>
  );
}

/** A single short text per language, stacked (used for photo descriptions). */
export function LangLines({ languages, value, onChange, placeholder }: { languages: Language[]; value: Record<string, string>; onChange: (locale: string, v: string) => void; placeholder?: string }) {
  return (
    <div className="grid gap-2">
      {languages.map((l) => (
        <label key={l.code} className="flex items-center gap-2">
          <span className="w-8 shrink-0 rounded bg-accent/15 px-1.5 py-1 text-center text-[0.65rem] font-semibold uppercase tracking-widest text-accent" title={l.name}>{l.code}</span>
          <input className="input !min-h-10 !py-2 text-sm" lang={l.code} dir={l.direction} placeholder={placeholder} value={value[l.code] ?? ''} onChange={(e) => onChange(l.code, e.target.value)} aria-label={`${placeholder ?? 'Text'} (${l.name})`} />
        </label>
      ))}
    </div>
  );
}
