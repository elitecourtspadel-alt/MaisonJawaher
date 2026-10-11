'use server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { assertAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { Denied } from '@/lib/admin/guard';
import { fail, type Result } from '@/lib/admin/result';
import { cleanupAbandonedUploads } from '@/lib/admin/media-cleanup';
import sharp from 'sharp';

const MIME: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
const MODULE = { products: 'products', categories: 'categories', slides: 'slides', settings: 'settings' } as const;

/** Uploads one image to storage. The person must be allowed to add or change that kind of item. */
export async function uploadImage(fd: FormData): Promise<Result<{ url: string; path: string }>> {
  try {
    const admin = await assertAdmin();
    const folder = z.enum(['products', 'categories', 'slides', 'settings']).parse(fd.get('folder'));
    const m = MODULE[folder];
    if (!admin.privileges.includes(`${m}.add`) && !admin.privileges.includes(`${m}.update`)) throw new Denied('You do not have permission to upload photos here.');
    const file = fd.get('file');
    if (!(file instanceof File) || !file.size) return { ok: false, error: 'No file was received.' };
    const ext = MIME[file.type];
    if (!ext) return { ok: false, error: 'Please choose a JPG, PNG, WebP or AVIF image.' };
    if (file.size > 8 * 1024 * 1024) return { ok: false, error: 'That image is larger than 8 MB.' };
    const bytes = Buffer.from(await file.arrayBuffer());
    try {
      const metadata = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
      if (!metadata.width || !metadata.height || !['jpeg', 'png', 'webp', 'avif', 'heif'].includes(metadata.format || '')) return { ok: false, error: 'This file is not a supported photo. Please choose a JPG, PNG, WebP or AVIF image.' };
    } catch { return { ok: false, error: 'This photo is damaged or cannot be read. Please choose another file.' }; }
    const path = `${folder}/${admin.userId}/${randomUUID()}.${ext}`;
    const sb = createAdminClient();
    const warning = await cleanupAbandonedUploads(sb, folder, admin.userId);
    const { error } = await sb.storage.from('media').upload(path, bytes, { contentType: file.type, cacheControl: '31536000' });
    if (error) return { ok: false, error: `The upload failed: ${error.message}` };
    return { ok: true, url: sb.storage.from('media').getPublicUrl(path).data.publicUrl, path, warning };
  } catch (e) { return fail(e); }
}
