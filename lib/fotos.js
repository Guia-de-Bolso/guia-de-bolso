/**
 * Normaliza campo `fotos` (array JSON, string JSON ou vazio).
 * @param {unknown} value
 * @returns {string[]}
 */
export function parseFotos(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Lista URLs de fotos de um lugar (galeria ou `imagem_url` legada).
 * @param {{ fotos?: unknown, imagem_url?: string }} [lugar]
 * @returns {string[]}
 */
export function getFotosFromLugar(lugar) {
  const fotos = parseFotos(lugar?.fotos);
  if (fotos.length > 0) return fotos;
  if (lugar?.imagem_url) return [lugar.imagem_url];
  return [];
}

/**
 * Retorna URL da capa do lugar (primeira foto disponível).
 * @param {{ fotos?: unknown, imagem_url?: string }} [lugar]
 * @returns {string}
 */
export function getCapaFromLugar(lugar) {
  return getFotosFromLugar(lugar)[0] || "";
}

/**
 * Lista URLs de fotos de uma rota (galeria ou campos legados de capa).
 * @param {{ fotos?: unknown, foto_capa?: string, imagem_capa?: string, imagem_url?: string }} [rota]
 * @returns {string[]}
 */
export function getFotosFromAtrativo(rota) {
  const fotos = parseFotos(rota?.fotos);
  if (fotos.length > 0) return fotos;
  const legado = rota?.foto_capa || rota?.imagem_capa || rota?.imagem_url;
  return legado ? [legado] : [];
}

/**
 * Retorna URL da capa da rota (primeira foto disponível).
 * @param {Object} [rota]
 * @returns {string}
 */
export function getCapaFromAtrativo(rota) {
  return getFotosFromAtrativo(rota)[0] || "";
}

/**
 * @typedef {{ id: string, url?: string, file?: File, preview?: string, existing: boolean }} PhotoItem
 */

/**
 * Monta itens iniciais do editor de fotos a partir de dados existentes.
 * @param {{ fotos?: unknown, [key: string]: unknown }} [data]
 * @param {string} [legacyUrlField='imagem_url'] - Campo de URL única legada.
 * @returns {PhotoItem[]}
 */
export function getInitialPhotoItems(data, legacyUrlField = "imagem_url") {
  const urls = parseFotos(data?.fotos);
  const legado = data?.[legacyUrlField];
  const all = urls.length > 0 ? urls : legado ? [legado] : [];

  return all.map((url, index) => ({
    id: `existing-${index}-${url}`,
    url,
    existing: true,
  }));
}
