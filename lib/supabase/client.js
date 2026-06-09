import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookieOptions";
import { SUPABASE_CONFIG_HELP, getSupabasePublicEnv } from "@/lib/supabase/publicEnv";

/** @type {import('@supabase/supabase-js').SupabaseClient | undefined} */
let browserClient;

/**
 * Cria (ou reutiliza) o cliente Supabase do browser — uma única instância evita
 * múltiplos GoTrueClient e sessão inconsistente entre componentes e `/api/uso-premium`.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    console.error(SUPABASE_CONFIG_HELP);
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey, {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
    });
  }
  return browserClient;
}
