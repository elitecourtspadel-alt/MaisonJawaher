import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isTestMode } from '../mode';
import { createLocalClient } from '../local/db';

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** True when a backend is usable: always in test mode, otherwise when the Supabase keys are present. */
export const isConfigured = () => isTestMode() || (!!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Session-aware client (reads the auth cookies). Supabase mode only. */
export async function createSessionClient() {
  const store = await cookies();
  return createServerClient(url(), anon(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a Server Component */ }
      },
    },
  });
}

/** Cookie-less anon client for public catalog reads. */
export function createPublicClient(): SupabaseClient {
  if (isTestMode()) return createLocalClient('anon') as unknown as SupabaseClient;
  return createClient(url(), anon(), { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(8000) }) } });
}

/** Service-role client — bypasses RLS. SERVER ONLY, always after authorisation. */
export function createAdminClient(): SupabaseClient {
  if (isTestMode()) return createLocalClient('service') as unknown as SupabaseClient;
  return createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
