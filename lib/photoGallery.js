import { parsePhotoEntries } from "./fotos.js";

/**
 * @typedef {{ url: string, thumb?: string, blur?: string }} GalleryPhoto
 */

/**
 * @param {unknown} entry
 * @returns {GalleryPhoto|null}
 */
function toGalleryPhoto(entry) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const url = entry.trim();
    return url ? { url } : null;
  }

  if (typeof entry === "object" && typeof entry.url === "string") {
    const url = entry.url.trim();
    if (!url) return null;

    const thumb = String(entry.thumb || "").trim();
    const blur = String(entry.blur || "").trim();

    return {
      url,
      ...(thumb && thumb !== url ? { thumb } : {}),
      ...(blur ? { blur } : {}),
    };
  }

  return null;
}

/**
 * @param {object} [rota]
 * @returns {GalleryPhoto[]}
 */
export function getGalleryPhotosFromAtrativo(rota) {
  const entries = parsePhotoEntries(rota?.fotos);
  if (entries.length > 0) {
    return entries.map((entry) => ({
      url: entry.url,
      thumb: entry.thumb,
      blur: entry.blur,
    }));
  }
  const legado = rota?.foto_capa || rota?.imagem_capa || rota?.imagem_url;
  return legado ? [{ url: legado }] : [];
}

/**
 * Mescla URLs resolvidas com metadados do JSON `fotos` (thumb/blur).
 * @param {{ fotos?: unknown }} [entity]
 * @param {string[]} [urls]
 * @returns {GalleryPhoto[]}
 */
export function mergeGalleryPhotos(entity, urls = []) {
  const entryByUrl = new Map(
    parsePhotoEntries(entity?.fotos).map((entry) => [entry.url, entry])
  );

  return urls.filter(Boolean).map((url) => {
    const entry = entryByUrl.get(url);
    if (!entry) return { url };
    return {
      url: entry.url,
      thumb: entry.thumb,
      blur: entry.blur,
    };
  });
}

/**
 * Fotos visíveis na galeria conforme regras de visibilidade do lugar.
 * @param {GalleryPhoto[]} photos
 * @param {string} capaUrl
 * @param {boolean} showGaleriaCompleta
 * @returns {GalleryPhoto[]}
 */
export function applyGalleryVisibility(photos, capaUrl, showGaleriaCompleta) {
  if (!photos?.length) return [];
  if (showGaleriaCompleta) return photos;
  if (capaUrl) {
    return [photos.find((photo) => photo.url === capaUrl) ?? { url: capaUrl }];
  }
  return [photos[0]];
}

/**
 * Normaliza prop `imagens` (strings legadas ou objetos com metadados).
 * @param {Array<string|GalleryPhoto>} [imagens]
 * @returns {GalleryPhoto[]}
 */
export function normalizeGalleryPhotos(imagens) {
  if (!imagens?.length) return [];
  return imagens.map((item) =>
    typeof item === "string" ? { url: item } : toGalleryPhoto(item)
  ).filter(Boolean);
}
