import { buildExplorarCountsFromLugares } from "@/lib/explorarCountsFromLugares";
import { queryAllLugaresAtivos } from "@/lib/lugaresQuery";

export { buildExplorarCountsFromLugares };

/**
 * Carrega todos os lugares ativos e monta o snapshot da tela Explorar.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<ReturnType<typeof buildExplorarCountsFromLugares>|null>}
 */
export async function fetchExplorarCategoryCounts(supabase) {
  const { data, error } = await queryAllLugaresAtivos(supabase);

  if (error) {
    console.error("[explorarCategoryCounts]", error.message);
    return null;
  }

  return buildExplorarCountsFromLugares(data ?? []);
}
