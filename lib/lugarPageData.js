import {
  normalizeFotosLegado,
  normalizeLugarForClient,
  normalizeTagsFromJoin,
  resolveLugarFotosIniciais,
} from "./lugarPageDataNormalize.js";
import { fetchLugarSeoBundle } from "./lugarSeoData.js";

export {
  normalizeFotosLegado,
  normalizeLugarForClient,
  normalizeTagsFromJoin,
  resolveLugarFotosIniciais,
} from "./lugarPageDataNormalize.js";

/**
 * Dados iniciais do detalhe do lugar para SSR + hidratação imediata no client.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} routeParam
 * @returns {Promise<{
 *   lugar: object|null,
 *   localizacao: object|null,
 *   rating: { media: number, count: number }|null,
 *   tags: object[],
 *   fotos: string[],
 *   error: import('@supabase/supabase-js').PostgrestError|null,
 * }>}
 */
export async function fetchLugarPageInitialData(supabase, routeParam) {
  const bundle = await fetchLugarSeoBundle(supabase, routeParam);

  if (bundle.error || !bundle.lugar) {
    return {
      lugar: null,
      localizacao: null,
      rating: null,
      tags: [],
      fotos: [],
      error: bundle.error,
    };
  }

  const lugarId = bundle.lugar.id;
  const [tagsRes, fotosLegadoRes] = await Promise.all([
    supabase.from("lugares_tags").select("tags(*)").eq("lugar_id", lugarId),
    supabase.from("fotos_lugar").select("*").eq("lugar_id", lugarId),
  ]);

  const fotosLegado = normalizeFotosLegado(fotosLegadoRes.data);
  const lugar = normalizeLugarForClient(bundle.lugar);

  return {
    lugar,
    localizacao: bundle.localizacao,
    rating: bundle.rating,
    tags: normalizeTagsFromJoin(tagsRes.data),
    fotos: resolveLugarFotosIniciais(lugar, fotosLegado),
    error: null,
  };
}
