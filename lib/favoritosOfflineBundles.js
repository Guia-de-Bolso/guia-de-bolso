import { getFotosFromAtrativo, getFotosFromLugar } from "./fotos.js";

/**
 * @param {Array<{ tags?: object }>|null|undefined} rows
 * @returns {object[]}
 */
export function normalizeTagsFromJoin(rows) {
  return (rows ?? []).map((item) => item.tags ?? item).filter(Boolean);
}

/**
 * @param {Array<object>|null|undefined} rows
 * @param {string} key
 * @returns {Map<string, object[]>}
 */
export function groupByKey(rows, key) {
  const map = new Map();
  for (const row of rows ?? []) {
    const id = row?.[key];
    if (id === null || id === undefined) continue;
    const groupedKey = String(id);
    if (!map.has(groupedKey)) map.set(groupedKey, []);
    map.get(groupedKey).push(row);
  }
  return map;
}

/**
 * @param {Array<object>|null|undefined} rows
 * @param {string} [idKey="id"]
 * @returns {Map<string, object>}
 */
export function indexById(rows, idKey = "id") {
  const map = new Map();
  for (const row of rows ?? []) {
    if (row?.[idKey] == null) continue;
    map.set(String(row[idKey]), row);
  }
  return map;
}

/**
 * @param {Array<object>|null|undefined} rows
 * @returns {object[]}
 */
export function sortByOrdem(rows) {
  return [...(rows ?? [])].sort((a, b) => (Number(a?.ordem) || 0) - (Number(b?.ordem) || 0));
}

/**
 * @param {object|null|undefined} lugar
 * @param {object|null|undefined} localizacao
 * @param {Array<object>|null|undefined} tagRows
 * @param {Array<object>|null|undefined} fotosLegadoRows
 * @returns {object|null}
 */
export function buildLugarOfflineBundle(lugar, localizacao, tagRows, fotosLegadoRows) {
  if (!lugar) return null;

  const fotosJson = getFotosFromLugar(lugar);
  const fotosLegado = (fotosLegadoRows ?? [])
    .map((foto) => foto.url || foto.imagem_url || foto.foto_url)
    .filter(Boolean);

  return {
    lugar,
    localizacao: localizacao ?? null,
    tags: normalizeTagsFromJoin(tagRows),
    fotos: fotosJson.length > 0 ? fotosJson : fotosLegado,
  };
}

/**
 * @param {object|null|undefined} rota
 * @param {Array<object>|null|undefined} pontos
 * @param {Array<object>|null|undefined} dicas
 * @param {object|null|undefined} localizacao
 * @returns {object|null}
 */
export function buildAtrativoOfflineBundle(rota, pontos, dicas, localizacao) {
  if (!rota) return null;

  return {
    rota,
    pontos: sortByOrdem(pontos),
    dicas: sortByOrdem(dicas),
    localizacao: localizacao ?? null,
    tags: (rota?.rotas_tags ?? []).map((item) => item.tags ?? item).filter(Boolean),
    fotos: getFotosFromAtrativo(rota),
  };
}
