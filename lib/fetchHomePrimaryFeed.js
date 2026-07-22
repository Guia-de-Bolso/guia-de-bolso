import { enrichLugaresFlags } from "@/lib/lugarBadges";
import { pickEmAltaCuradoria, pickParceirosCarrossel } from "@/lib/homeSelection";
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
  const [lugares, atrativos, parceiros] = await Promise.all([
    fetchLugaresFromApi({ limit: 50, cache: "no-store" }),
    fetchAtrativosFromApi({ limit: 50 }),
    fetchLugaresFromApi({ mode: "parceiros", limit: 100, cache: "no-store" }),
  ]);

  const lugaresAtivos = normalizeLugaresTaxonomia(enrichLugaresFlags(lugares ?? []));
  const lugaresParceirosPool = normalizeLugaresTaxonomia(enrichLugaresFlags(parceiros ?? []));

  return {
    lugaresAtivos,
    atrativosAtivos: atrativos ?? [],
    lugaresParceiros: pickParceirosCarrossel(lugaresParceirosPool),
    lugaresEmAlta: pickEmAltaCuradoria(lugaresAtivos),
    lugaresProximos: lugaresAtivos.slice(0, 6),
  };
}
