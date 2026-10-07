import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { ModuleKey } from '../access';
import { flatten, toMap } from '../translations';
import type { Tr } from '../types';
import { audit, describeChange, diffFields, diffTranslations } from './audit';
import { createdBy, Denied, guard, updatedBy } from './guard';
import { checkTranslations, loadLanguages, saveTranslations } from './translations';
import { dbError, fail, slugify, trSchema, type Result } from './result';
import { removeUnusedMedia } from './media-cleanup';

type FieldSpec = { max: number; required?: boolean; label: string };

export type EntityConfig = {
  module: ModuleKey;
  table: string;
  trTable: string;
  fk: string;
  noun: string;                    // "category", "hero slide"
  trFields: Record<string, FieldSpec>;
  labelField: string;              // which translated field names the item
  scalars: z.ZodObject<any>;       // validated plain columns
  scalarLabels: Record<string, string>;
  image?: boolean;                 // has image_url + image_path
  slug?: boolean;                  // has a web address generated from the name
  beforeDelete?: (sb: SupabaseClient, id: string, label: string) => Promise<string | null>;
  toggleNote?: (sb: SupabaseClient, id: string, active: boolean) => Promise<string>;
};

const refresh = () => revalidatePath('/', 'layout');

/** Save, delete and turn on/off for "an item with translated wording": categories, slides, FAQs, announcements. */
export function makeEntity(cfg: EntityConfig) {
  const trLabels = Object.fromEntries(Object.entries(cfg.trFields).map(([k, v]) => [k, v.label]));
  const trKeys = Object.keys(cfg.trFields);
  const the = `the ${cfg.noun}`;

  const labelOf = (tr: Tr[] | undefined, defaultCode: string) =>
    (tr?.find((t) => t.locale === defaultCode)?.[cfg.labelField] as string) || (tr?.find((t) => t[cfg.labelField])?.[cfg.labelField] as string) || cfg.noun;

  const load = async (sb: SupabaseClient, id: string) => {
    const { data } = await sb.from(cfg.table).select(`*, ${cfg.trTable}(*)`).eq('id', id).maybeSingle();
    return data ? (flatten(data as unknown) as Record<string, any> & { translations: Tr[] }) : null;
  };

  async function save(input: unknown): Promise<Result<{ id: string }>> {
    try {
      const parsed = cfg.scalars.extend({ id: z.string().uuid().optional(), translations: trSchema }).parse(input);
      const { id, translations, ...scalars } = parsed as Record<string, any>;
      const { admin, sb } = await guard(cfg.module, id ? 'update' : 'add');

      const languages = await loadLanguages(sb);
      const def = languages.find((l) => l.is_default) ?? languages[0];
      const checked = checkTranslations(translations, languages, cfg.trFields);
      if (!checked.ok) return { ok: false, error: Object.values(checked.errors)[0], fieldErrors: checked.errors };
      const label = checked.value[def.code]?.[cfg.labelField] || cfg.noun;
      const names = Object.fromEntries(languages.map((l) => [l.code, l.name]));

      const before = id ? await load(sb, id) : null;
      if (id && !before) return { ok: false, error: `That ${cfg.noun} no longer exists.` };

      // Turning something on or off needs its own privilege
      const canToggle = admin.privileges.includes(`${cfg.module}.toggle`);
      const wantsActive = scalars.is_active as boolean;
      if (before && before.is_active !== wantsActive && !canToggle) throw new Denied('You are not allowed to turn this on or off.');
      scalars.is_active = before ? wantsActive : canToggle ? wantsActive : true;
      if (cfg.image && scalars.is_active && !scalars.image_url) {
        const message = `Please add a photo before making this ${cfg.module === 'categories' ? 'category' : 'slide'} active.`;
        return { ok: false, error: message, fieldErrors: { image_url: message } };
      }

      const row: Record<string, unknown> = { ...scalars };
      if (cfg.slug) {
        const wanted = slugify(String(scalars.slug || '')) || slugify(checked.value.en?.[cfg.labelField] || label);
        if (!wanted) return { ok: false, error: 'A web address could not be made from that name.', fieldErrors: { slug: 'Required' } };
        row.slug = wanted;
      }

      let itemId = id as string | undefined;
      if (itemId) {
        const { error } = await sb.from(cfg.table).update({ ...row, ...updatedBy(admin) }).eq('id', itemId);
        const e = dbError(error); if (e) return e;
      } else {
        const { data, error } = await sb.from(cfg.table).insert({ ...row, ...createdBy(admin) }).select('id').single();
        const e = dbError(error); if (e) return e;
        itemId = data!.id as string;
      }
      await saveTranslations(sb, cfg.trTable, cfg.fk, itemId, checked.value, trKeys, admin);

      const warning = cfg.image && before?.image_path && before.image_path !== row.image_path ? await removeUnusedMedia(sb, [before.image_path]) : undefined;

      if (!before) {
        await audit(sb, admin, { action: 'created', entity: cfg.noun, entityId: itemId, label, summary: `Added ${the} “${label}”.` });
      } else {
        const changes = [
          ...diffFields(before, row, { ...cfg.scalarLabels, ...(cfg.slug ? { slug: 'Web address' } : {}) }).filter((c) => c.label !== 'Active'),
          ...(cfg.image && before.image_url !== row.image_url ? [{ label: 'Photo', from: before.image_url ? 'previous photo' : 'none', to: row.image_url ? 'new photo' : 'none' }] : []),
          ...diffTranslations(before.translations, checked.value, trLabels, names),
        ];
        if (changes.length) await audit(sb, admin, { action: 'changed', entity: cfg.noun, entityId: itemId, label, summary: describeChange(cfg.noun, label, changes), changes });
        if (before.is_active !== scalars.is_active) {
          await audit(sb, admin, { action: scalars.is_active ? 'turned_on' : 'turned_off', entity: cfg.noun, entityId: itemId, label, summary: `Turned ${scalars.is_active ? 'on' : 'off'} ${the} “${label}”.` });
        }
      }
      refresh();
      return { ok: true, id: itemId, warning };
    } catch (e) { return fail(e); }
  }

  async function remove(id: string): Promise<Result> {
    try {
      const { admin, sb } = await guard(cfg.module, 'delete');
      const row = await load(sb, id);
      if (!row) return { ok: true };
      const languages = await loadLanguages(sb);
      const label = labelOf(row.translations, (languages.find((l) => l.is_default) ?? languages[0]).code);
      const blocked = await cfg.beforeDelete?.(sb, id, label);
      if (blocked) return { ok: false, error: blocked };
      const { error } = await sb.from(cfg.table).delete().eq('id', id);
      if (error) return dbError(error) as Result;
      const warning = cfg.image && row.image_path ? await removeUnusedMedia(sb, [row.image_path]) : undefined;
      await audit(sb, admin, { action: 'deleted', entity: cfg.noun, entityId: id, label, summary: `Deleted ${the} “${label}”.` });
      refresh();
      return { ok: true, warning };
    } catch (e) { return fail(e); }
  }

  async function toggle(id: string, active: boolean): Promise<Result> {
    try {
      const { admin, sb } = await guard(cfg.module, 'toggle');
      const row = await load(sb, id);
      if (!row) return { ok: false, error: `That ${cfg.noun} no longer exists.` };
      if (active && cfg.image && !row.image_url) return { ok: false, error: 'Add a photo on the edit page before making this item active.' };
      const languages = await loadLanguages(sb);
      const label = labelOf(row.translations, (languages.find((l) => l.is_default) ?? languages[0]).code);
      const { error } = await sb.from(cfg.table).update({ is_active: active, ...updatedBy(admin) }).eq('id', id);
      if (error) return { ok: false, error: error.message };
      const note = (await cfg.toggleNote?.(sb, id, active)) ?? '';
      await audit(sb, admin, { action: active ? 'turned_on' : 'turned_off', entity: cfg.noun, entityId: id, label, summary: `Turned ${active ? 'on' : 'off'} ${the} “${label}”.${note ? ` ${note}` : ''}` });
      refresh();
      return { ok: true };
    } catch (e) { return fail(e); }
  }

  return { save, remove, toggle, toMap };
}
