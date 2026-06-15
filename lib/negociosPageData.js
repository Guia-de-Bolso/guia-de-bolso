import { enrichLugaresFlags, isConteudoCuradoria } from "@/lib/lugarBadges";
import {
  fetchLandingPageData,
  getLandingFallbackData,
  serializeLugarForLanding,
  serializeAtrativoForLanding,
} from "@/lib/landingPageData";
import { getCapaFromLugar } from "@/lib/fotos";
import { normalizeLugaresTaxonomia } from "@/lib/lugarTaxonomia";
import { getAnonServerClient } from "@/lib/supabaseAnonServer";

const NEGOCIOS_LUGAR_SELECT =
  "id, nome, slug, descricao, categoria, subcategoria, imagem_url, fotos, horarios, mostrar_horarios, status, eh_parceiro, conteudo_curadoria, created_at, localizacoes(endereco_completo), lugares_tags(tags(id, nome))";

const NEGOCIOS_ROTA_SELECT =
  "id, titulo, descricao, fotos, foto_capa, imagem_capa, categoria, dificuldade, duracao_minutos, distancia_km, ativa";

const CURADORIA_AMOSTRA = 4;
const ROTAS_AMOSTRA = 3;

/**
 * @param {import('@/lib/landingPageData').LandingPageData} base
 * @returns {import('@/lib/negociosPageData').NegociosPageData}
 */
function getNegociosFallbackData(base) {
  return {
    ...base,
    parceirosTodos: base.parceiros ?? [],
    curadoria: { count: 0, amostra: [] },
    atrativosAmostra: base.atrativos ?? [],
  };
}

/**
 * Dados SSR da página /para-negocios — parceiros completos + curadoria.
 * @returns {Promise<import('@/lib/negociosPageData').NegociosPageData>}
 */
export async function fetchNegociosPageData() {
  const base = await fetchLandingPageData();
  const supabase = getAnonServerClient();
  if (!supabase) return getNegociosFallbackData(base ?? getLandingFallbackData());

  const [parceirosRes, curadoriaCountRes, atrativosCountRes, curadoriaRes, atrativosRes] =
    await Promise.all([
      supabase
        .from("lugares")
        .select(NEGOCIOS_LUGAR_SELECT)
        .eq("status", "ativo")
        .eq("eh_parceiro", true)
        .order("nome"),
      supabase
        .from("lugares")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo")
        .eq("conteudo_curadoria", true),
      supabase.from("rotas").select("*", { count: "exact", head: true }).eq("ativa", true),
      supabase
        .from("lugares")
        .select(NEGOCIOS_LUGAR_SELECT)
        .eq("status", "ativo")
        .eq("conteudo_curadoria", true)
        .order("nome")
        .limit(48),
      supabase
        .from("rotas")
        .select(NEGOCIOS_ROTA_SELECT)
        .eq("ativa", true)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  if (parceirosRes.error) {
    console.error("[negociosPageData] parceiros:", parceirosRes.error.message);
  }

  const parceirosRaw = normalizeLugaresTaxonomia(
    enrichLugaresFlags(parceirosRes.data ?? [])
  );
  const parceirosTodos = parceirosRaw.map(serializeLugarForLanding);

  const curadoriaRaw = normalizeLugaresTaxonomia(
    enrichLugaresFlags(curadoriaRes.data ?? [])
  );
  const curadoriaAmostra = curadoriaRaw
    .filter((l) => isConteudoCuradoria(l) && getCapaFromLugar(l))
    .slice(0, CURADORIA_AMOSTRA)
    .map(serializeLugarForLanding);

  const atrativosAmostra = (atrativosRes.data ?? [])
    .map(serializeAtrativoForLanding)
    .filter(Boolean)
    .filter((r) => r.capa)
    .slice(0, ROTAS_AMOSTRA);

  const curadoriaCount = curadoriaCountRes.count ?? curadoriaRaw.length;
  const atrativosCount = atrativosCountRes.count ?? atrativosAmostra.length;

  return {
    ...base,
    stats: {
      ...base.stats,
      curadoriaCount,
      atrativosCount,
    },
    parceirosTodos,
    curadoria: {
      count: curadoriaCount,
      amostra: curadoriaAmostra,
    },
    atrativosAmostra,
  };
}

/**
 * @typedef {import('@/lib/landingPageData').LandingPageData & {
 *   parceirosTodos: import('@/lib/landingPageData').LandingLugarCard[],
 *   curadoria: { count: number, amostra: import('@/lib/landingPageData').LandingLugarCard[] },
 *   atrativosAmostra: import('@/lib/landingPageData').LandingAtrativoCard[],
 *   stats: import('@/lib/landingPageData').LandingPageData['stats'] & {
 *     curadoriaCount?: number,
 *     atrativosCount?: number,
 *   },
 * }} NegociosPageData
 */
