import { getFotosFromLugar } from "./fotos.js";

/**
 * Remove join aninhado de localização do objeto lugar (formato do client).
 * @param {object} lugar
 * @returns {object}
 */
export function normalizeLugarForClient(lugar) {
  if (!lugar || typeof lugar !== "object") return lugar;
  const { localizacoes: _localizacoes, ...rest } = lugar;
  return rest;
}

/**
 * Normaliza tags do join Supabase `lugares_tags(tags(*))`.
 * @param {Array<{ tags?: object }>|null|undefined} rows
 * @returns {object[]}
 */
export function normalizeTagsFromJoin(rows) {
  return (rows ?? []).map((item) => item.tags).filter(Boolean);
}

/**
 * URLs de fotos legadas (`fotos_lugar`).
 * @param {Array<{ url?: string, imagem_url?: string, foto_url?: string }>|null|undefined} rows
 * @returns {string[]}
 */
export function normalizeFotosLegado(rows) {
  return (rows ?? [])
    .map((foto) => foto.url || foto.imagem_url || foto.foto_url)
    .filter(Boolean);
}

/**
 * Resolve lista de fotos para exibição (JSON no lugar ou tabela legada).
 * @param {object} lugar
 * @param {string[]} [fotosLegado]
 * @returns {string[]}
 */
export function resolveLugarFotosIniciais(lugar, fotosLegado = []) {
  const fromJson = getFotosFromLugar(lugar);
  if (fromJson.length > 0) return fromJson;
  return fotosLegado;
}
