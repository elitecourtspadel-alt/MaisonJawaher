import 'server-only';
import { cache } from 'react';
import { createPublicClient, isConfigured } from './supabase/server';
import { isTestMode } from './mode';

export type BackendStatus = 'ready' | 'empty' | 'setup' | 'unavailable' | 'unconfigured';
export const getBackendStatus = cache(async (): Promise<BackendStatus> => {
  if (isTestMode()) return 'ready';
  if (!isConfigured()) return 'unconfigured';
  try {
    const sb = createPublicClient();
    const rows = await Promise.all([
      sb.from('site_settings').select('id').eq('id', 1).limit(1),
      sb.from('languages').select('code').limit(1),
      sb.from('products').select('id').limit(1),
    ]);
    const errors = rows.flatMap((r) => r.error ? [r.error] : []);
    if (errors.some((e) => ['42P01', '42703', 'PGRST205', 'PGRST200'].includes(e.code))) return 'setup';
    if (errors.length) return 'unavailable';
    if (!rows[0].data?.length || !rows[1].data?.length) return 'setup';
    return rows[2].data?.length ? 'ready' : 'empty';
  } catch { return 'unavailable'; }
});

export function backendMessage(status: BackendStatus, locale = 'en') {
  const messages = locale === 'fr' ? {
    ready: '', empty: 'Le mode Supabase est actif. Aucun produit n’est encore disponible. La collection sera publiée prochainement.',
    setup: 'Le mode Supabase est actif, mais la boutique n’est pas encore prête. Le propriétaire doit terminer la configuration et ajouter les premières données.',
    unavailable: 'La connexion aux données de la boutique est momentanément indisponible. Veuillez réessayer plus tard.',
    unconfigured: 'Le mode Supabase est actif, mais la connexion n’est pas encore configurée. Le propriétaire doit terminer la configuration.',
  } : {
    ready: '', empty: 'Supabase mode is active. There are no products available yet. The collection will be added soon.',
    setup: 'Supabase mode is active, but the store is not ready yet. The site owner needs to finish the database setup and add the first data.',
    unavailable: 'We cannot connect to the store’s data right now. Please try again later.',
    unconfigured: 'Supabase mode is active, but its connection is not set up yet. Please ask the site owner to finish the setup.',
  };
  return messages[status];
}
