import {
  cacheFavoritoImageUrls,
  FAVORITO_OFFLINE_TYPES,
  removeOfflineFavorito,
  saveOfflineFavorito,
  setOfflineFavoritosSyncedAt,
} from "@/lib/favoritosOffline";
import { applyPublicLugarFilters, PUBLIC_APP_PARTNERS_ONLY } from "@/lib/publicCatalog";
import { precacheFavoritosAfterSync, precacheFavoritosShell } from "@/lib/serviceWorker";
import { favoritoRoteiroPath } from "@/lib/roteirosPaths";
import { fetchRotasFavoritas } from "@/lib/rotasFavoritas";
import {
  buildAtrativoOfflineBundle,
  buildLugarOfflineBundle,
  groupByKey,
  indexById,
} from "@/lib/favoritosOfflineBundles";

/**
 * @param {unknown} id
 * @returns {string}
 */
function asId(id) {
  return String(id);
}

/**
 * Carrega bundles offline de vários lugares em 4 queries (não N+1).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Array<string|number>} lugarIds
 * @returns {Promise<Map<string, object>>}
 */
export async function fetchLugaresOfflineBundles(supabase, lugarIds) {
  const ids = [...new Set((lugarIds ?? []).map(asId).filter(Boolean))];
  /** @type {Map<string, object>} */
  const bundles = new Map();
  if (ids.length === 0) return bundles;

  const [lugaresRes, localizacaoRes, tagsRes, fotosLegadoRes] = await Promise.all([
    applyPublicLugarFilters(supabase.from("lugares").select("*").in("id", ids)),
    supabase.from("localizacoes").select("*").in("lugar_id", ids),
    supabase.from("lugares_tags").select("lugar_id, tags(*)").in("lugar_id", ids),
    supabase.from("fotos_lugar").select("*").in("lugar_id", ids),
  ]);

  if (lugaresRes.error || !lugaresRes.data?.length) return bundles;

  const lugaresById = indexById(lugaresRes.data);
  const locByLugar = new Map();
  for (const loc of localizacaoRes.data ?? []) {
    const key = asId(loc.lugar_id);
    if (!locByLugar.has(key)) locByLugar.set(key, loc);
  }
  const tagsByLugar = groupByKey(tagsRes.data, "lugar_id");
  const fotosByLugar = groupByKey(fotosLegadoRes.data, "lugar_id");

  for (const id of ids) {
    const bundle = buildLugarOfflineBundle(
      lugaresById.get(id),
      locByLugar.get(id) ?? null,
      tagsByLugar.get(id) ?? [],
      fotosByLugar.get(id) ?? []
    );
    if (bundle) bundles.set(id, bundle);
  }

  return bundles;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} lugarId
 * @returns {Promise<object|null>}
 */
export async function fetchLugarOfflineBundle(supabase, lugarId) {
  const bundles = await fetchLugaresOfflineBundles(supabase, [lugarId]);
  return bundles.get(asId(lugarId)) ?? null;
}

/**
 * Carrega bundles offline de vários atrativos em 4 queries (não N+1).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Array<string|number>} rotaIds
 * @returns {Promise<Map<string, object>>}
 */
export async function fetchAtrativosOfflineBundles(supabase, rotaIds) {
  const ids = [...new Set((rotaIds ?? []).map(asId).filter(Boolean))];
  /** @type {Map<string, object>} */
  const bundles = new Map();
  if (ids.length === 0) return bundles;

  const [rotasRes, pontosRes, dicasRes, localizacaoRes] = await Promise.all([
    supabase.from("rotas").select("*, rotas_tags(tags(*))").in("id", ids),
    supabase.from("rota_pontos").select("*, rota_ponto_detalhes(id, texto, ordem)").in("rota_id", ids),
    supabase.from("rota_dicas").select("*").in("rota_id", ids),
    supabase.from("rotas_localizacoes").select("*").in("rota_id", ids),
  ]);

  if (rotasRes.error || !rotasRes.data?.length) return bundles;

  const rotasById = indexById(rotasRes.data);
  const pontosByRota = groupByKey(pontosRes.data, "rota_id");
  const dicasByRota = groupByKey(dicasRes.data, "rota_id");
  const locByRota = new Map();
  for (const loc of localizacaoRes.data ?? []) {
    const key = asId(loc.rota_id);
    if (!locByRota.has(key)) locByRota.set(key, loc);
  }

  for (const id of ids) {
    const bundle = buildAtrativoOfflineBundle(
      rotasById.get(id),
      pontosByRota.get(id) ?? [],
      dicasByRota.get(id) ?? [],
      locByRota.get(id) ?? null
    );
    if (bundle) bundles.set(id, bundle);
  }

  return bundles;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} rotaId
 * @returns {Promise<object|null>}
 */
export async function fetchAtrativoOfflineBundle(supabase, rotaId) {
  const bundles = await fetchAtrativosOfflineBundles(supabase, [rotaId]);
  return bundles.get(asId(rotaId)) ?? null;
}

/**
 * @param {object} bundle
 * @returns {string[]}
 */
function imageUrlsFromLugarBundle(bundle) {
  return bundle?.fotos ?? [];
}

/**
 * @param {object} bundle
 * @returns {string[]}
 */
function imageUrlsFromAtrativoBundle(bundle) {
  return bundle?.fotos ?? [];
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
  await setOfflineFavoritosSyncedAt(userId, new Date().toISOString());
  void cacheFavoritoImageUrls(imageUrlsFromLugarBundle(bundle));
  void precacheFavoritosShell([`/favoritos/lugar/${lugarId}`]);
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
  await setOfflineFavoritosSyncedAt(userId, new Date().toISOString());
  void cacheFavoritoImageUrls(imageUrlsFromAtrativoBundle(bundle));
  void precacheFavoritosShell([favoritoRoteiroPath(rotaId)]);
  return true;
}

/**
 * Atualiza cache local de todos os favoritos do usuário (online).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{ lugares: object[], atrativos: object[] }>}
 */
export async function syncAllFavoritosOffline(supabase, userId) {
  const favoritosLugaresQuery = supabase
    .from("favoritos")
    .select("lugar_id, lugares!inner(*)")
    .eq("user_id", userId)
    .eq("lugares.status", "ativo");

  if (PUBLIC_APP_PARTNERS_ONLY) {
    favoritosLugaresQuery.eq("lugares.eh_parceiro", true);
  }

  const { data: favoritosLugares, error: lugaresError } = await favoritosLugaresQuery;

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
      const { data: lugaresData } = await applyPublicLugarFilters(
        supabase.from("lugares").select("*").in("id", ids)
      );
      lugares = lugaresData ?? [];
    }
  }

  const { rotas: atrativos } = await fetchRotasFavoritas(supabase, userId);

  const lugarBundles = await fetchLugaresOfflineBundles(
    supabase,
    lugares.map((lugar) => lugar.id)
  );
  const atrativoBundles = await fetchAtrativosOfflineBundles(
    supabase,
    atrativos.map((rota) => rota.id)
  );

  await Promise.all([
    ...[...lugarBundles.entries()].map(([lugarId, bundle]) =>
      saveOfflineFavorito(userId, FAVORITO_OFFLINE_TYPES.LUGAR, lugarId, bundle)
    ),
    ...[...atrativoBundles.entries()].map(([rotaId, bundle]) =>
      saveOfflineFavorito(userId, FAVORITO_OFFLINE_TYPES.ATIVO, rotaId, bundle)
    ),
  ]);

  const syncedAt = new Date().toISOString();
  await setOfflineFavoritosSyncedAt(userId, syncedAt);

  void Promise.all([
    ...[...lugarBundles.values()].map((bundle) =>
      cacheFavoritoImageUrls(imageUrlsFromLugarBundle(bundle))
    ),
    ...[...atrativoBundles.values()].map((bundle) =>
      cacheFavoritoImageUrls(imageUrlsFromAtrativoBundle(bundle))
    ),
    precacheFavoritosAfterSync(lugares, atrativos),
  ]);

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
