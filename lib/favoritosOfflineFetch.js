import {
  fetchFotosLugarLegado,
  fetchLocalizacaoLugar,
  fetchLugarAtivo,
  fetchTagsLugar,
} from "@/lib/data/lugarDetalheQueries";
import { getFotosFromAtrativo, getFotosFromLugar } from "@/lib/fotos";
import { getTagsFromAtrativo } from "@/lib/tags";
import {
  cacheFavoritoImageUrls,
  FAVORITO_OFFLINE_TYPES,
  removeOfflineFavorito,
  saveOfflineFavorito,
  setOfflineFavoritosSyncedAt,
} from "@/lib/favoritosOffline";
import { fetchRotasFavoritas } from "@/lib/rotasFavoritas";

/**
 * Normaliza tags do join Supabase.
 * @param {Array<{ tags?: object }>|null|undefined} rows
 * @returns {object[]}
 */
function normalizeTagsFromJoin(rows) {
  return (rows ?? []).map((item) => item.tags ?? item).filter(Boolean);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} lugarId
 * @returns {Promise<object|null>}
 */
export async function fetchLugarOfflineBundle(supabase, lugarId) {
  const [lugarRes, localizacaoRes, tagsRes, fotosLegadoRes] = await Promise.all([
    fetchLugarAtivo(supabase, lugarId),
    fetchLocalizacaoLugar(supabase, lugarId),
    fetchTagsLugar(supabase, lugarId),
    fetchFotosLugarLegado(supabase, lugarId),
  ]);

  if (lugarRes.error || !lugarRes.data) return null;

  const fotosJson = getFotosFromLugar(lugarRes.data);
  const fotosLegado = (fotosLegadoRes.data ?? [])
    .map((foto) => foto.url || foto.imagem_url || foto.foto_url)
    .filter(Boolean);
  const fotos = fotosJson.length > 0 ? fotosJson : fotosLegado;

  return {
    lugar: lugarRes.data,
    localizacao: localizacaoRes.data ?? null,
    tags: normalizeTagsFromJoin(tagsRes.data),
    fotos,
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} rotaId
 * @returns {Promise<object|null>}
 */
export async function fetchAtrativoOfflineBundle(supabase, rotaId) {
  const { data: rota, error } = await supabase
    .from("rotas")
    .select("*, rotas_tags(tags(*))")
    .eq("id", rotaId)
    .maybeSingle();

  if (error || !rota) return null;

  const [{ data: pontosData }, { data: dicasData }, { data: localizacao }] = await Promise.all([
    supabase
      .from("rota_pontos")
      .select("*, rota_ponto_detalhes(id, texto, ordem)")
      .eq("rota_id", rotaId)
      .order("ordem", { ascending: true }),
    supabase
      .from("rota_dicas")
      .select("*")
      .eq("rota_id", rotaId)
      .order("ordem", { ascending: true }),
    supabase.from("rotas_localizacoes").select("*").eq("rota_id", rotaId).maybeSingle(),
  ]);

  const tags = getTagsFromAtrativo(rota);
  const fotos = getFotosFromAtrativo(rota);

  return {
    rota,
    pontos: pontosData ?? [],
    dicas: dicasData ?? [],
    localizacao: localizacao ?? null,
    tags,
    fotos,
  };
}

/**
 * @param {object} bundle
 * @returns {string[]}
 */
function imageUrlsFromLugarBundle(bundle) {
  if (!bundle) return [];
  return bundle.fotos?.length ? bundle.fotos : getFotosFromLugar(bundle.lugar);
}

/**
 * @param {object} bundle
 * @returns {string[]}
 */
function imageUrlsFromAtrativoBundle(bundle) {
  if (!bundle) return [];
  return bundle.fotos?.length ? bundle.fotos : getFotosFromAtrativo(bundle.rota);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} lugarId
 * @returns {Promise<boolean>}
 */
export async function cacheLugarFavoritoFromServer(supabase, userId, lugarId) {
  const bundle = await fetchLugarOfflineBundle(supabase, lugarId);
  if (!bundle?.lugar) return false;

  await saveOfflineFavorito(userId, FAVORITO_OFFLINE_TYPES.LUGAR, lugarId, bundle);
  await cacheFavoritoImageUrls(imageUrlsFromLugarBundle(bundle));
  return true;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} rotaId
 * @returns {Promise<boolean>}
 */
export async function cacheAtrativoFavoritoFromServer(supabase, userId, rotaId) {
  const bundle = await fetchAtrativoOfflineBundle(supabase, rotaId);
  if (!bundle?.rota) return false;

  await saveOfflineFavorito(userId, FAVORITO_OFFLINE_TYPES.ATIVO, rotaId, bundle);
  await cacheFavoritoImageUrls(imageUrlsFromAtrativoBundle(bundle));
  return true;
}

/**
 * Atualiza cache local de todos os favoritos do usuário (online).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{ lugares: object[], atrativos: object[] }>}
 */
export async function syncAllFavoritosOffline(supabase, userId) {
  const { data: favoritosLugares, error: lugaresError } = await supabase
    .from("favoritos")
    .select("lugar_id, lugares!inner(*)")
    .eq("user_id", userId)
    .eq("lugares.status", "ativo");

  let lugares = [];

  if (!lugaresError) {
    lugares = (favoritosLugares ?? [])
      .map((row) => {
        const nested = row.lugares;
        if (Array.isArray(nested)) return nested[0];
        return nested;
      })
      .filter(Boolean);
  } else {
    const { data: idsRows } = await supabase
      .from("favoritos")
      .select("lugar_id")
      .eq("user_id", userId);

    const ids = (idsRows ?? []).map((row) => row.lugar_id);
    if (ids.length > 0) {
      const { data: lugaresData } = await supabase
        .from("lugares")
        .select("*")
        .in("id", ids)
        .eq("status", "ativo");
      lugares = lugaresData ?? [];
    }
  }

  const { rotas: atrativos } = await fetchRotasFavoritas(supabase, userId);

  await Promise.all([
    ...lugares.map((lugar) => cacheLugarFavoritoFromServer(supabase, userId, String(lugar.id))),
    ...atrativos.map((rota) =>
      cacheAtrativoFavoritoFromServer(supabase, userId, String(rota.id))
    ),
  ]);

  const syncedAt = new Date().toISOString();
  await setOfflineFavoritosSyncedAt(userId, syncedAt);

  return { lugares, atrativos, syncedAt };
}

/**
 * @param {string} userId
 * @param {"lugar"|"atrativo"} type
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function purgeOfflineFavorito(userId, type, id) {
  await removeOfflineFavorito(userId, type, id);
}
