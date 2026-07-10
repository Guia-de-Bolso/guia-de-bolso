import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CONFIG_HELP, getSupabasePublicEnv } from "@/lib/supabase/publicEnv";

/** @type {import('@supabase/supabase-js').SupabaseClient | undefined} */
let browserClient;

/**
 * Cria (ou reutiliza) o cliente Supabase do browser — uma única instância evita
 * múltiplos GoTrueClient e sessão inconsistente entre componentes e `/api/uso-premium`.
 * Refresh de token: exclusivamente via `middleware.js` (`autoRefreshToken: false`).
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
      auth: {
        // Refresh só no middleware — evita corrida com getUser() paralelos no client.
        autoRefreshToken: false,
        persistSession: true,
      },
    });
  }
  return browserClient;
}
