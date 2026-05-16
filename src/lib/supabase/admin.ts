import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses RLS.
 * NEVER expose to the browser. Use only in server-side route handlers / services.
 *
 * NOTE: Intentionally untyped — weaver service functions cast return values
 * explicitly (e.g. `as ScreenElementMap`), which is the safety boundary.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient(): ReturnType<typeof createClient<any>> {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
