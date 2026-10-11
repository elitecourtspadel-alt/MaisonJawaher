import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditChange, Tr } from '../types';
import type { AdminSession } from '../admin-auth';

export type AuditAction = 'created' | 'changed' | 'deleted' | 'turned_on' | 'turned_off' | 'signed_in' | 'signed_out' | 'security';

export async function audit(sb: SupabaseClient, who: Pick<AdminSession, 'userId' | 'name' | 'email'>, e: {
  action: AuditAction; entity: string; entityId?: string; label?: string; summary: string; changes?: AuditChange[];
}) {
  try {
    await sb.from('audit_log').insert({
      actor_id: who.userId, actor_name: who.name || who.email, action: e.action, entity: e.entity, entity_id: e.entityId ?? null,
      entity_label: e.label ?? '', summary: e.summary, details: e.changes ?? [], created_by: who.userId, updated_by: who.userId,
    });
  } catch (err) { console.error('[audit]', err); } // history must never block the real change
}

const show = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return 'empty';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  const s = String(v).replace(/\s+/g, ' ').trim();
  return s.length > 90 ? `${s.slice(0, 87)}…` : s;
};

/** Differences between two plain objects, using human labels. */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>, labels: Record<string, string>): AuditChange[] {
  const out: AuditChange[] = [];
  for (const [key, label] of Object.entries(labels)) {
    if (!(key in after)) continue;
    const a = before[key] ?? '', b = after[key] ?? '';
    if (String(a) !== String(b)) out.push({ label, from: show(before[key]), to: show(after[key]) });
  }
  return out;
}

/** Differences between the saved translations and the submitted ones, labelled with the language name. */
export function diffTranslations(before: Tr[] | undefined, after: Record<string, Record<string, string>>, labels: Record<string, string>, languageNames: Record<string, string>): AuditChange[] {
  const out: AuditChange[] = [];
  for (const [locale, fields] of Object.entries(after)) {
    const prev = (before ?? []).find((t) => t.locale === locale);
    for (const [field, label] of Object.entries(labels)) {
      if (!(field in fields)) continue;
      const a = (prev?.[field] as string) ?? '', b = fields[field] ?? '';
      if (a.trim() !== b.trim()) out.push({ label: `${label} (${languageNames[locale] ?? locale})`, from: show(a), to: show(b) });
    }
  }
  return out;
}

const join = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/** "Changed the price of the product “Lune Ring” from 450 to 480." */
export function describeChange(noun: string, label: string, changes: AuditChange[]): string {
  if (!changes.length) return `Saved the ${noun} “${label}” without changing anything.`;
  if (changes.length === 1) {
    const c = changes[0];
    return `Changed the ${c.label.toLowerCase()} of the ${noun} “${label}” from ${c.from === 'empty' ? 'nothing' : `“${c.from}”`} to ${c.to === 'empty' ? 'nothing' : `“${c.to}”`}.`;
  }
  const names = changes.map((c) => c.label.toLowerCase());
  const shown = names.length > 3 ? [...names.slice(0, 3), `${names.length - 3} more`] : names;
  return `Updated the ${noun} “${label}”: changed ${join(shown)}.`;
}
