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

/**
 * Cliente Supabase para páginas públicas com `generateStaticParams`
 * (detalhe de lugar/atrativo, categoria). Usa sempre a anon key — sem
 * `cookies()` — para o Next poder renderizar a rota como SSG/estática e não
 * quebrar com `DYNAMIC_SERVER_USAGE`. Só lê conteúdo público (RLS `status = 'ativo'`).
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient|null>}
 */
export async function createPublicPageServerClient() {
  return getAnonServerClient();
}
