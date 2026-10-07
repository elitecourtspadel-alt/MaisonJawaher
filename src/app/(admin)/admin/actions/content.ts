'use server';
import { z } from 'zod';
import { makeEntity } from '@/lib/admin/entity';
import { imageUrl, type Result } from '@/lib/admin/result';

const order = z.coerce.number().int().default(0);

/* ───────── categories ───────── */
const categories = makeEntity({
  module: 'categories', table: 'categories', trTable: 'category_translations', fk: 'category_id', noun: 'category', labelField: 'name', slug: true, image: true,
  trFields: {
    name: { max: 100, required: true, label: 'The name' },
    description: { max: 1000, label: 'The description' },
    seo_title: { max: 120, label: 'The search title' },
    seo_description: { max: 300, label: 'The search description' },
  },
  scalars: z.object({
    slug: z.string().trim().max(80).default(''),
    image_url: imageUrl('Please choose a valid category photo').nullable().default(null), image_path: z.string().nullable().default(null),
    sort_order: order, is_active: z.boolean().default(true),
  }),
  scalarLabels: { sort_order: 'Display order', is_active: 'Active' },
  async beforeDelete(sb, id, label) {
    const { count } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
    return count ? `“${label}” still has ${count} ${count === 1 ? 'product' : 'products'}. Move ${count === 1 ? 'it' : 'them'} to another category or delete ${count === 1 ? 'it' : 'them'} first.` : null;
  },
  async toggleNote(sb, id, active) {
    const { count } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
    if (!count) return '';
    return active ? `Its ${count} ${count === 1 ? 'product is' : 'products are'} visible on the website again.` : `Its ${count} ${count === 1 ? 'product is' : 'products are'} now hidden from the website.`;
  },
});

export async function saveCategory(input: unknown): Promise<Result<{ id: string }>> { return categories.save(input); }
export async function deleteCategory(id: string): Promise<Result> { return categories.remove(id); }
export async function toggleCategory(id: string, active: boolean): Promise<Result> { return categories.toggle(id, active); }

/* ───────── hero slides ───────── */
const slides = makeEntity({
  module: 'slides', table: 'slides', trTable: 'slide_translations', fk: 'slide_id', noun: 'hero slide', labelField: 'title', image: true,
  trFields: {
    title: { max: 120, label: 'The title' },
    subtitle: { max: 240, label: 'The subtitle' },
    cta_label: { max: 40, label: 'The button text' },
  },
  scalars: z.object({
    image_url: imageUrl('Please add a photo for this slide'), image_path: z.string().nullable().default(null),
    cta_url: z.string().trim().max(300).refine((v) => !v || v.startsWith('/') || /^https?:\/\//.test(v), 'Use a page like /shop or a full link starting with https://').default(''),
    sort_order: order, is_active: z.boolean().default(true),
  }),
  scalarLabels: { cta_url: 'Button link', sort_order: 'Display order' },
});
export async function saveSlide(input: unknown): Promise<Result<{ id: string }>> { return slides.save(input); }
export async function deleteSlide(id: string): Promise<Result> { return slides.remove(id); }
export async function toggleSlide(id: string, active: boolean): Promise<Result> { return slides.toggle(id, active); }

/* ───────── FAQs ───────── */
const faqs = makeEntity({
  module: 'faqs', table: 'faqs', trTable: 'faq_translations', fk: 'faq_id', noun: 'question', labelField: 'question',
  trFields: { question: { max: 300, required: true, label: 'The question' }, answer: { max: 2000, required: true, label: 'The answer' } },
  scalars: z.object({ sort_order: order, is_active: z.boolean().default(true) }),
  scalarLabels: { sort_order: 'Display order' },
});
export async function saveFaq(input: unknown): Promise<Result<{ id: string }>> { return faqs.save(input); }
export async function deleteFaq(id: string): Promise<Result> { return faqs.remove(id); }
export async function toggleFaq(id: string, active: boolean): Promise<Result> { return faqs.toggle(id, active); }

/* ───────── announcements ───────── */
const announcements = makeEntity({
  module: 'announcements', table: 'announcements', trTable: 'announcement_translations', fk: 'announcement_id', noun: 'announcement', labelField: 'message',
  trFields: { message: { max: 200, required: true, label: 'The message' } },
  scalars: z.object({ sort_order: order, is_active: z.boolean().default(true) }),
  scalarLabels: { sort_order: 'Display order' },
});
export async function saveAnnouncement(input: unknown): Promise<Result<{ id: string }>> { return announcements.save(input); }
export async function deleteAnnouncement(id: string): Promise<Result> { return announcements.remove(id); }
export async function toggleAnnouncement(id: string, active: boolean): Promise<Result> { return announcements.toggle(id, active); }
