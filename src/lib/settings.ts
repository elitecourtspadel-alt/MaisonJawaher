import { cache } from 'react';
import type { SiteSettings } from './types';
import { createPublicClient, isConfigured } from './supabase/server';
import { defaultSettings, mergeSettings } from './settings-defaults';
import { getBackendStatus } from './backend-status';

export { defaultSettings, mergeSettings, platforms } from './settings-defaults';

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!isConfigured()) return defaultSettings;
  if (['setup', 'unavailable', 'unconfigured'].includes(await getBackendStatus())) return defaultSettings;
  try {
    const { data } = await createPublicClient().from('site_settings').select('data').eq('id', 1).maybeSingle();
    return mergeSettings(data?.data as Partial<SiteSettings>);
  } catch {
    return defaultSettings;
  }
});
