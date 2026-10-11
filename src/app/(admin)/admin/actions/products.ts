'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { audit, describeChange, diffFields, diffTranslations } from '@/lib/admin/audit';
import { createdBy, Denied, guard, updatedBy } from '@/lib/admin/guard';
import { checkTranslations, loadLanguages, saveTranslations } from '@/lib/admin/translations';
import { dbError, fail, imageUrl, num, slugify, trSchema, type Result } from '@/lib/admin/result';
import { flatten } from '@/lib/translations';
import type { Product, Tr } from '@/lib/types';
import { removeUnusedMedia } from '@/lib/admin/media-cleanup';

const PRODUCT_TR = {
  name: { max: 150, required: true, label: 'The name' },
  short_description: { max: 300, label: 'The short description' },
  description: { max: 6000, label: 'The description' },
  material: { max: 160, label: 'The material' },
  seo_title: { max: 120, label: 'The search title' },
  seo_description: { max: 300, label: 'The search description' },
};
const TR_LABELS = { name: 'Name', short_description: 'Short description', description: 'Description', material: 'Material', seo_title: 'Search title', seo_description: 'Search description' };
const SCALAR_LABELS = {
  category_id: 'Category', slug: 'Web address', sku: 'Reference', price: 'Price', compare_price: 'Old price', show_price: 'Show price',
  stock: 'Stock', track_stock: 'Track stock', is_featured: 'Featured', is_new: 'New arrival', weight: 'Weight', dimensions: 'Size', sort_order: 'Display order',
};

const schema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid().nullable().default(null),
  slug: z.string().trim().max(80).default(''),
  sku: z.string().trim().max(60).default(''),
  price: num.default(null), compare_price: num.default(null),
  show_price: z.boolean().default(true),
  stock: z.coerce.number().int().min(0).default(0), track_stock: z.boolean().default(false),
  is_featured: z.boolean().default(false), is_new: z.boolean().default(false), is_active: z.boolean().default(true),
  weight: z.string().trim().max(60).default(''), dimensions: z.string().trim().max(120).default(''),
  sort_order: z.coerce.number().int().default(0),
  translations: trSchema,
  images: z.array(z.object({ id: z.string().uuid().optional(), url: imageUrl(), path: z.string().nullable().default(null), translations: trSchema })).max(12).default([]),
  sections: z.array(z.object({ id: z.string().uuid().optional(), translations: trSchema })).max(12).default([]),
});

const refresh = () => revalidatePath('/', 'layout');

async function loadProduct(sb: any, id: string) {
  const { data } = await sb.from('products').select('*, product_translations(*), product_images(*, product_image_translations(*)), product_sections(*, product_section_translations(*))').eq('id', id).maybeSingle();
  return data ? (flatten(data) as Product & { translations: Tr[] }) : null;
}

export async function saveProduct(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const { id, translations, images, sections, ...scalars } = schema.parse(input);
    const { admin, sb } = await guard('products', id ? 'update' : 'add');

    const languages = await loadLanguages(sb);
    const def = languages.find((l) => l.is_default) ?? languages[0];
    const names = Object.fromEntries(languages.map((l) => [l.code, l.name]));
    const checked = checkTranslations(translations, languages, PRODUCT_TR);
    if (!checked.ok) return { ok: false, error: Object.values(checked.errors)[0], fieldErrors: checked.errors };
    const label = checked.value[def.code].name;

    const before = id ? await loadProduct(sb, id) : null;
    if (id && !before) return { ok: false, error: 'That product no longer exists.' };

    const canToggle = admin.privileges.includes('products.toggle');
    if (before && before.is_active !== scalars.is_active && !canToggle) throw new Denied('You are not allowed to turn this on or off.');
    const is_active = before ? scalars.is_active : canToggle ? scalars.is_active : true;
    if (is_active && !images.length) {
      const message = 'Please add at least one photo before making this product active.';
      return { ok: false, error: message, fieldErrors: { images: message } };
    }

    const row = { ...scalars, is_active, slug: slugify(scalars.slug || checked.value.en?.name || label) };
    if (!row.slug) return { ok: false, error: 'A web address could not be made from that name.', fieldErrors: { slug: 'Required' } };
    if (row.category_id) {
      const { data: cat } = await sb.from('categories').select('id').eq('id', row.category_id).maybeSingle();
      if (!cat) return { ok: false, error: 'That category no longer exists.', fieldErrors: { category_id: 'Choose a category' } };
    }

    let pid = id;
    if (pid) {
      const { error } = await sb.from('products').update({ ...row, ...updatedBy(admin) }).eq('id', pid);
      const e = dbError(error); if (e) return e;
    } else {
      const { data, error } = await sb.from('products').insert({ ...row, ...createdBy(admin) }).select('id').single();
      const e = dbError(error); if (e) return e;
      pid = data!.id as string;
    }
    await saveTranslations(sb, 'product_translations', 'product_id', pid!, checked.value, Object.keys(PRODUCT_TR), admin);

    // photos: update the ones that stay, add new ones, remove the rest
    const oldImages = before?.product_images ?? [];
    const keepImages = new Set(images.map((i) => i.id).filter(Boolean));
    const gone = oldImages.filter((i) => !keepImages.has(i.id));
    let warning: string | undefined;
    if (gone.length) {
      const { error } = await sb.from('product_images').delete().in('id', gone.map((g) => g.id));
      if (error) return { ok: false, error: 'The photo could not be removed. Please try saving again.' };
      const paths = gone.map((g) => g.path).filter(Boolean) as string[];
      if (paths.length) warning = await removeUnusedMedia(sb, paths);
    }
    for (const [i, im] of images.entries()) {
      let imageId = im.id;
      if (imageId && oldImages.some((o) => o.id === imageId)) await sb.from('product_images').update({ sort_order: i, ...updatedBy(admin) }).eq('id', imageId);
      else {
        const { data, error } = await sb.from('product_images').insert({ product_id: pid, url: im.url, path: im.path, sort_order: i, ...createdBy(admin) }).select('id').single();
        if (error) return { ok: false, error: error.message };
        imageId = data!.id as string;
      }
      const altOnly: Record<string, Record<string, string>> = {};
      for (const l of languages) altOnly[l.code] = { alt_text: (im.translations[l.code]?.alt_text ?? '').trim().slice(0, 200) };
      await saveTranslations(sb, 'product_image_translations', 'image_id', imageId!, altOnly, ['alt_text'], admin);
    }

    // expandable sections
    const oldSections = before?.product_sections ?? [];
    const keepSections = new Set(sections.map((s) => s.id).filter(Boolean));
    const goneSections = oldSections.filter((s) => !keepSections.has(s.id));
    if (goneSections.length) await sb.from('product_sections').delete().in('id', goneSections.map((g) => g.id));
    for (const [i, s] of sections.entries()) {
      let sid = s.id;
      if (sid && oldSections.some((o) => o.id === sid)) await sb.from('product_sections').update({ sort_order: i, ...updatedBy(admin) }).eq('id', sid);
      else {
        const { data, error } = await sb.from('product_sections').insert({ product_id: pid, sort_order: i, ...createdBy(admin) }).select('id').single();
        if (error) return { ok: false, error: error.message };
        sid = data!.id as string;
      }
      const clean: Record<string, Record<string, string>> = {};
      for (const l of languages) clean[l.code] = { title: (s.translations[l.code]?.title ?? '').trim().slice(0, 120), body: (s.translations[l.code]?.body ?? '').trim().slice(0, 3000) };
      await saveTranslations(sb, 'product_section_translations', 'section_id', sid!, clean, ['title', 'body'], admin);
    }

    if (!before) {
      await audit(sb, admin, { action: 'created', entity: 'product', entityId: pid, label, summary: `Added the product “${label}”.` });
    } else {
      const changes = [
        ...diffFields(before as any, row, SCALAR_LABELS).filter((c) => c.label !== 'Category'),
        ...(before.category_id !== row.category_id ? [{ label: 'Category', from: 'previous category', to: 'new category' }] : []),
        ...diffTranslations(before.translations, checked.value, TR_LABELS, names),
        ...(oldImages.length !== images.length ? [{ label: 'Number of photos', from: String(oldImages.length), to: String(images.length) }] : []),
        ...(oldSections.length !== sections.length ? [{ label: 'Number of extra sections', from: String(oldSections.length), to: String(sections.length) }] : []),
      ];
      if (changes.length) await audit(sb, admin, { action: 'changed', entity: 'product', entityId: pid, label, summary: describeChange('product', label, changes), changes });
      if (before.is_active !== is_active) await audit(sb, admin, { action: is_active ? 'turned_on' : 'turned_off', entity: 'product', entityId: pid, label, summary: `Turned ${is_active ? 'on' : 'off'} the product “${label}”.` });
    }
    refresh();
    return { ok: true, id: pid!, warning };
  } catch (e) { return fail(e); }
}

export async function deleteProduct(id: string): Promise<Result> {
  try {
    const { admin, sb } = await guard('products', 'delete');
    const p = await loadProduct(sb, id);
    if (!p) return { ok: true };
    const label = p.translations.find((t) => t.name)?.name as string ?? 'product';
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    const paths = (p.product_images ?? []).map((i) => i.path).filter(Boolean) as string[];
    const warning = paths.length ? await removeUnusedMedia(sb, paths) : undefined;
    await audit(sb, admin, { action: 'deleted', entity: 'product', entityId: id, label, summary: `Deleted the product “${label}”.` });
    refresh();
    return { ok: true, warning };
  } catch (e) { return fail(e); }
}

/** Quick switches from the list: published (needs the on/off privilege), featured and new (need update). */
export async function toggleProduct(id: string, field: 'is_active' | 'is_featured' | 'is_new', value: boolean): Promise<Result> {
  try {
    const { admin, sb } = await guard('products', field === 'is_active' ? 'toggle' : 'update');
    const p = await loadProduct(sb, id);
    if (!p) return { ok: false, error: 'That product no longer exists.' };
    if (field === 'is_active' && value && !p.product_images?.length) return { ok: false, error: 'Add at least one photo on the edit page before making this product active.' };
    const label = p.translations.find((t) => t.name)?.name as string ?? 'product';
    const { error } = await sb.from('products').update({ [field]: value, ...updatedBy(admin) }).eq('id', id);
    if (error) return { ok: false, error: error.message };
    const what = { is_active: ['Turned on', 'Turned off', 'the product'], is_featured: ['Marked', 'Removed', 'the product'], is_new: ['Marked', 'Removed', 'the product'] }[field];
    const summary = field === 'is_active'
      ? `${value ? what[0] : what[1]} ${what[2]} “${label}”.`
      : value ? `Marked “${label}” as ${field === 'is_featured' ? 'a signature piece' : 'a new arrival'}.` : `Removed “${label}” from ${field === 'is_featured' ? 'the signature pieces' : 'the new arrivals'}.`;
    await audit(sb, admin, { action: field === 'is_active' ? (value ? 'turned_on' : 'turned_off') : 'changed', entity: 'product', entityId: id, label, summary });
    refresh();
    return { ok: true };
  } catch (e) { return fail(e); }
}
