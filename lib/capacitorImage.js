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
