import { enrichLugaresFlags } from "@/lib/lugarBadges";
import { pickEmAltaCuradoria, pickParceirosPorCategoria } from "@/lib/homeSelection";
import { fetchAtrativosFromApi } from "@/lib/fetchAtrativosApi";
import { fetchLugaresFromApi } from "@/lib/fetchLugaresApi";
import { normalizeLugaresTaxonomia } from "@/lib/lugarTaxonomia";

/**
 * Feed principal da home (lugares + atrativos) para cache client-side.
 * @returns {Promise<{
 *   lugaresAtivos: object[],
 *   atrativosAtivos: object[],
 *   lugaresParceiros: object[],
 *   lugaresEmAlta: object[],
 *   lugaresProximos: object[],
 * }>}
 */
export async function fetchHomePrimaryFeed() {
  const [lugares, atrativos] = await Promise.all([
    fetchLugaresFromApi({ limit: 50 }),
    fetchAtrativosFromApi({ limit: 50 }),
  ]);

  const lugaresAtivos = normalizeLugaresTaxonomia(enrichLugaresFlags(lugares ?? []));

  return {
    lugaresAtivos,
    atrativosAtivos: atrativos ?? [],
    lugaresParceiros: pickParceirosPorCategoria(lugaresAtivos),
    lugaresEmAlta: pickEmAltaCuradoria(lugaresAtivos),
    lugaresProximos: lugaresAtivos.slice(0, 6),
  };
}
