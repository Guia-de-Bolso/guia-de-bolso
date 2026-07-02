import { isCapacitorBuild } from "@/lib/capacitorBuild";
import { getAnonServerClient } from "@/lib/supabaseAnonServer";
import { createClient } from "@/lib/supabase/server";

/**
 * Cliente Supabase para páginas SSR — anon no export Capacitor (sem cookies).
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient|null>}
 */
export async function createPageServerClient() {
  if (isCapacitorBuild()) {
    return getAnonServerClient();
  }

  return createClient();
}
