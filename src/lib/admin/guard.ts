import 'server-only';
import { assertAdmin, type AdminSession } from '../admin-auth';
import { createAdminClient } from '../supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Action, ModuleKey } from '../access';

export type Ctx = { admin: AdminSession; sb: SupabaseClient };

export class Denied extends Error {}

/** Used at the top of every admin server action: checks the signed-in admin holds the privilege. */
export async function guard(module: ModuleKey, action: Action): Promise<Ctx> {
  const admin = await assertAdmin();
  if (!admin.privileges.includes(`${module}.${action}`)) throw new Denied('You do not have permission to do this.');
  return { admin, sb: createAdminClient() };
}

/** Columns every table tracks, filled in for the person making the change. */
export const createdBy = (a: AdminSession) => ({ created_by: a.userId, updated_by: a.userId });
export const updatedBy = (a: AdminSession) => ({ updated_by: a.userId });
