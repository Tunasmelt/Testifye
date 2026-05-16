import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client.
 *
 * Intentionally untyped at the client level — service functions cast
 * return values explicitly (e.g. `as Project`), which is the type safety boundary.
 * The Database generic in supabase-js v2 requires very specific shapes
 * that conflict with our Partial<T> insert helpers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): ReturnType<typeof createBrowserClient<any>> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
