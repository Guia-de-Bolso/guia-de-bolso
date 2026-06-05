import { fetchExplorarCategoryCounts } from "@/lib/explorarCategoryCounts";
import { getAnonServerClient } from "@/lib/supabaseAnonServer";

/**
 * Contagens e capas por categoria para a tela Explorar.
 * @returns {Promise<import('@/lib/explorarCategoryCounts').buildExplorarCountsFromLugares|null>}
 */
export async function fetchExplorarPageData() {
  const supabase = getAnonServerClient();
  if (!supabase) return null;

  return fetchExplorarCategoryCounts(supabase);
}
