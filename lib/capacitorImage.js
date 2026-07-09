import { isCapacitorNative } from "./capacitorNavigation.js";

/**
 * No app nativo não há otimizador Vercel — thumbs economizam banda em slides distantes.
 * @param {{ url: string, thumb?: string, isActive?: boolean, isAdjacent?: boolean }} options
 * @returns {string}
 */
export function resolveCapacitorGallerySrc({
  url,
  thumb,
  isActive = false,
  isAdjacent = false,
}) {
  if (!url) return "";
  if (!isCapacitorNative()) return url;
  if (isActive || isAdjacent) return url;
  return thumb || url;
}

/**
 * Lista/cards no nativo devem preferir thumb quando disponível.
 * @returns {boolean}
 */
export function shouldPreferPhotoThumb() {
  return isCapacitorNative();
}

/**
 * Resolve src de card/lista (thumb no Capacitor, URL passada na web).
 * @param {string} fullUrl
 * @param {string} [thumbUrl]
 * @returns {string}
 */
export function resolveListPhotoSrc(fullUrl, thumbUrl) {
  if (!fullUrl) return "";
  if (shouldPreferPhotoThumb() && thumbUrl) return thumbUrl;
  return fullUrl;
}
