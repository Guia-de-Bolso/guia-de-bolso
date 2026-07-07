import { enrichLugaresFlags } from "@/lib/lugarBadges";
import { pickEmAltaCuradoria, pickParceirosCarrossel } from "@/lib/homeSelection";
import { normalizeLugaresTaxonomia } from "@/lib/lugarTaxonomia";
import { queryLugaresAtivos } from "@/lib/lugaresQuery";
import { getAnonServerClient } from "@/lib/supabaseAnonServer";

/**
 * Dados iniciais da home para SSR (feed principal sem esperar hidratação).
 * @returns {Promise<{
 *   lugaresAtivos: object[],
 *   atrativosAtivos: object[],
 *   lugaresParceiros: object[],
 *   lugaresEmAlta: object[],
 *   lugaresProximos: object[],
 * }|null>}
 */
export async function fetchHomePageInitialData() {
  const supabase = getAnonServerClient();
  if (!supabase) return null;

  const [lugaresRes, atrativosRes, parceirosRes] = await Promise.all([
    queryLugaresAtivos(supabase, { limit: 50 }),
    supabase
      .from("rotas")
      .select("*")
      .eq("ativa", true)
      .order("created_at", { ascending: false })
      .limit(50),
    queryLugaresAtivos(supabase, { limit: 100, eq: { eh_parceiro: true } }),
  ]);

  if (lugaresRes.error) {
    console.error("[homePageData] lugares:", lugaresRes.error.message);
    return null;
  }

  const lugaresAtivos = normalizeLugaresTaxonomia(enrichLugaresFlags(lugaresRes.data ?? []));
  const atrativosAtivos = atrativosRes.data ?? [];
  const lugaresParceirosPool = normalizeLugaresTaxonomia(
    enrichLugaresFlags(parceirosRes.data ?? [])
  );

  return {
    lugaresAtivos,
    atrativosAtivos,
    lugaresParceiros: pickParceirosCarrossel(lugaresParceirosPool),
    lugaresEmAlta: pickEmAltaCuradoria(lugaresAtivos),
    lugaresProximos: lugaresAtivos.slice(0, 6),
  };
}
