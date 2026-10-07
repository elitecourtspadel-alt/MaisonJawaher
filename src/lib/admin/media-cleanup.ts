import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Never remove a file still referenced by any saved product, category, or slide. */
export async function removeUnusedMedia(sb: SupabaseClient, paths: string[]): Promise<string | undefined> {
  const unique = [...new Set(paths)].filter((p) => /^(products|categories|slides|settings)\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/.test(p));
  if (!unique.length) return;
  const reads = await Promise.all([
    sb.from('product_images').select('path,url'), sb.from('categories').select('image_path,image_url'), sb.from('slides').select('image_path,image_url'),
    sb.from('site_settings').select('data'),
  ]);
  if (reads.some((r) => r.error)) return 'Your changes were saved, but unused image files could not be checked for cleanup.';
  const references = [
    ...(reads[0].data ?? []).map((r) => ({ path: r.path, url: r.url })),
    ...(reads[1].data ?? []).map((r) => ({ path: r.image_path, url: r.image_url })),
    ...(reads[2].data ?? []).map((r) => ({ path: r.image_path, url: r.image_url })),
    ...(reads[3].data ?? []).map((r) => ({ path: r.data?.hero_background_path, url: r.data?.hero_background_url })),
  ];
  const unused = unique.filter((p) => {
    const url = sb.storage.from('media').getPublicUrl(p).data.publicUrl;
    return !references.some((r) => r.path === p || r.url === url);
  });
  if (!unused.length) return;
  const { error } = await sb.storage.from('media').remove(unused);
  if (error) return 'Your changes were saved, but an unused image file could not be deleted from storage. Please retry cleanup later.';
}

/** Uploads abandoned for over 24 hours are cleaned on the owner's next upload. */
export async function cleanupAbandonedUploads(sb: SupabaseClient, folder: string, userId: string) {
  const prefix = `${folder}/${userId}`;
  const paths: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await sb.storage.from('media').list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) return 'Older unused uploads could not be checked for cleanup.';
    for (const file of data ?? []) {
      const created = Date.parse(file.created_at || '');
      if (file.id && Number.isFinite(created) && created < Date.now() - 24 * 60 * 60 * 1000) paths.push(`${prefix}/${file.name}`);
    }
    if (!data || data.length < 100) break;
  }
  return removeUnusedMedia(sb, paths);
}
