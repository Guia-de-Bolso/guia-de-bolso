/**
 * @typedef {{ url: string, thumb: string, blur?: string }} PhotoEntry
 */

/**
 * Normaliza campo `fotos` (array JSON, string JSON ou vazio).
 * Aceita strings legadas ou objetos `{ url, thumb }`.
 * @param {unknown} value
 * @returns {Array<string|{ url: string, thumb?: string }>}
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
 * @param {unknown} entry
 * @returns {PhotoEntry|null}
 */
export function normalizePhotoEntry(entry) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const url = entry.trim();
    return url ? { url, thumb: url } : null;
  }

  if (typeof entry === "object" && typeof entry.url === "string") {
    const url = entry.url.trim();
    const thumb = String(entry.thumb || url).trim();
    const blur = String(entry.blur || "").trim();
    return url
      ? {
          url,
          thumb: thumb || url,
          ...(blur ? { blur } : {}),
        }
      : null;
  }

  return null;
}

/**
 * @param {unknown} value
 * @returns {PhotoEntry[]}
 */
export function parsePhotoEntries(value) {
  return parseFotos(value).map(normalizePhotoEntry).filter(Boolean);
}

/**
 * URL full de um item salvo em `fotos`.
 * @param {string|{ url?: string, thumb?: string }} [entry]
 * @returns {string}
 */
export function getPhotoEntryUrl(entry) {
  return normalizePhotoEntry(entry)?.url || "";
}

/**
 * URL de thumbnail de um item salvo em `fotos`.
 * @param {string|{ url?: string, thumb?: string }} [entry]
 * @returns {string}
 */
export function getPhotoEntryThumb(entry) {
  return normalizePhotoEntry(entry)?.thumb || "";
}

/**
 * Blur LQIP de um item salvo em `fotos`.
 * @param {string|{ url?: string, blur?: string }} [entry]
 * @returns {string}
 */
export function getPhotoEntryBlur(entry) {
  return normalizePhotoEntry(entry)?.blur || "";
}

/**
 * Serializa entrada para persistência no JSON `fotos`.
 * @param {PhotoEntry} entry
 * @returns {string|{ url: string, thumb?: string, blur?: string }}
 */
export function serializePhotoEntry(entry) {
  const normalized = normalizePhotoEntry(entry);
  if (!normalized) return null;

  const hasThumb = normalized.thumb && normalized.thumb !== normalized.url;
  const hasBlur = Boolean(normalized.blur);

  if (!hasThumb && !hasBlur) return normalized.url;

  const payload = { url: normalized.url };
  if (hasThumb) payload.thumb = normalized.thumb;
  if (hasBlur) payload.blur = normalized.blur;
  return payload;
}

/**
 * Lista URLs full de fotos de um lugar (galeria ou `imagem_url` legada).
 * @param {{ fotos?: unknown, imagem_url?: string }} [lugar]
 * @returns {string[]}
 */
export function getFotosFromLugar(lugar) {
  const entries = parsePhotoEntries(lugar?.fotos);
  if (entries.length > 0) return entries.map((entry) => entry.url);
  if (lugar?.imagem_url) return [lugar.imagem_url];
  return [];
}

/**
 * Retorna URL da capa do lugar (primeira foto full disponível).
 * @param {{ fotos?: unknown, imagem_url?: string }} [lugar]
 * @returns {string}
 */
export function getCapaFromLugar(lugar) {
  return getFotosFromLugar(lugar)[0] || "";
}

/**
 * Retorna URL de thumbnail da capa (fallback para full em fotos legadas).
 * @param {{ fotos?: unknown, imagem_url?: string }} [lugar]
 * @returns {string}
 */
export function getCapaThumbFromLugar(lugar) {
  const entries = parsePhotoEntries(lugar?.fotos);
  if (entries.length > 0) return entries[0].thumb;
  return lugar?.imagem_url || "";
}

/**
 * Blur LQIP da capa do lugar (vazio se legado sem blur no upload).
 * @param {{ fotos?: unknown }} [lugar]
 * @returns {string}
 */
export function getCapaBlurFromLugar(lugar) {
  const entries = parsePhotoEntries(lugar?.fotos);
  return entries[0]?.blur || "";
}

/**
 * Lista URLs de fotos de uma rota (galeria ou campos legados de capa).
 * @param {{ fotos?: unknown, foto_capa?: string, imagem_capa?: string, imagem_url?: string }} [rota]
 * @returns {string[]}
 */
export function getFotosFromAtrativo(rota) {
  const entries = parsePhotoEntries(rota?.fotos);
  if (entries.length > 0) return entries.map((entry) => entry.url);
  const legado = rota?.foto_capa || rota?.imagem_capa || rota?.imagem_url;
  return legado ? [legado] : [];
}

/**
 * Retorna URL da capa da rota (primeira foto full disponível).
 * @param {Object} [rota]
 * @returns {string}
 */
export function getCapaFromAtrativo(rota) {
  return getFotosFromAtrativo(rota)[0] || "";
}

/**
 * Retorna URL de thumbnail da capa da rota.
 * @param {Object} [rota]
 * @returns {string}
 */
export function getCapaThumbFromAtrativo(rota) {
  const entries = parsePhotoEntries(rota?.fotos);
  if (entries.length > 0) return entries[0].thumb;
  return rota?.foto_capa || rota?.imagem_capa || rota?.imagem_url || "";
}

/**
 * Blur LQIP da capa da rota.
 * @param {Object} [rota]
 * @returns {string}
 */
export function getCapaBlurFromAtrativo(rota) {
  const entries = parsePhotoEntries(rota?.fotos);
  return entries[0]?.blur || "";
}

/**
 * @typedef {{ id: string, url?: string, thumbUrl?: string, blurUrl?: string, file?: File, preview?: string, existing: boolean }} PhotoItem
 */

/**
 * Monta itens iniciais do editor de fotos a partir de dados existentes.
 * @param {{ fotos?: unknown, [key: string]: unknown }} [data]
 * @param {string} [legacyUrlField='imagem_url'] - Campo de URL única legada.
 * @returns {PhotoItem[]}
 */
export function getInitialPhotoItems(data, legacyUrlField = "imagem_url") {
  const entries = parsePhotoEntries(data?.fotos);
  const legado = data?.[legacyUrlField];
  const all =
    entries.length > 0
      ? entries
      : legado
        ? [{ url: String(legado), thumb: String(legado) }]
        : [];

  return all.map((entry, index) => ({
    id: `existing-${index}-${entry.url}`,
    url: entry.url,
    thumbUrl: entry.thumb,
    blurUrl: entry.blur,
    existing: true,
  }));
}
