/**
 * The public address of the admin portal. The pages live in src/app/(admin)/admin, but visitors (and bots) only
 * ever see this path: src/proxy.ts rewrites it to the internal route and answers 404 for a plain /admin.
 * Set NEXT_PUBLIC_ADMIN_PATH per environment (config/dev.env, config/prod.env) to a private, hard-to-guess value.
 * Plain .mjs so the command-line tools can share it.
 */
export const normalizeAdminPath = (value) => {
  const p = `/${String(value ?? '').trim().replace(/^\/+|\/+$/g, '')}`;
  return /^\/[a-z0-9][a-z0-9-]{3,40}$/.test(p) && p !== '/admin' ? p : '/portal-x7k2m9';
};

export const ADMIN_PATH = normalizeAdminPath(process.env.NEXT_PUBLIC_ADMIN_PATH);
