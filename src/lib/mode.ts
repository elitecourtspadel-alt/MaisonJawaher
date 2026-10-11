/**
 * APP_MODE=test     → no Supabase needed: local JSON database (.data/db.json), local image storage, local admin login + 2FA.
 * APP_MODE=supabase → Supabase database, storage and auth.
 * Unset: Supabase when its URL is configured, otherwise test mode.
 */
export const isTestMode = () => {
  const m = (process.env.APP_MODE ?? '').toLowerCase();
  if (m === 'test' || m === 'local') return true;
  if (m === 'supabase') return false;
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
};
