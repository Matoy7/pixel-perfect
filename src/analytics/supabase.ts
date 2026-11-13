import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase connection, configured at build time:
 *   VITE_SUPABASE_URL              https://<project>.supabase.co
 *   VITE_SUPABASE_PUBLISHABLE_KEY  sb_publishable_…  (safe in the browser; RLS protects the data)
 * Never put a secret / service-role key here.
 * Without these the game runs exactly as before and nothing is tracked.
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(URL && KEY);

/**
 * Lazily loaded client (keeps supabase-js out of the first paint).
 * storageKey separates sessions on the same site: the game's anonymous player
 * and the admin dashboard login never overwrite each other.
 */
export async function createSupabase(storageKey: string): Promise<SupabaseClient | null> {
  if (!supabaseConfigured) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(URL!, KEY!, {
    auth: { storageKey, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
}
