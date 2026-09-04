import { normalizeGalleryPhotos } from "./photoGallery.js";

export const GALLERY_MEDIA_PHOTO = "photo";
export const GALLERY_MEDIA_VIDEO = "video";

export const GALLERY_VIDEO_LAYOUT_PORTRAIT = "portrait";
export const GALLERY_VIDEO_LAYOUT_LANDSCAPE = "landscape";
export const GALLERY_VIDEO_LAYOUT_UNKNOWN = "unknown";

/** Distância máxima (px) para considerar toque, não swipe. */
export const GALLERY_TAP_MAX_MOVE_PX = 12;

/** Duração máxima (ms) de um toque. */
export const GALLERY_TAP_MAX_MS = 450;

/**
 * @typedef {{ type: "photo", url: string, thumb?: string, blur?: string }} GalleryPhotoItem
 * @typedef {{ type: "video", url: string, poster?: string|null }} GalleryVideoItem
 * @typedef {GalleryPhotoItem|GalleryVideoItem} GalleryMediaItem
 */

/**
 * @param {unknown} item
 * @returns {boolean}
 */
export function isGalleryVideoItem(item) {
  return item?.type === GALLERY_MEDIA_VIDEO && Boolean(String(item?.url || "").trim());
}

/**
 * Layout do viewer: retrato (quadro 9:16) se o arquivo for mais alto que largo.
 * @param {number} width
 * @param {number} height
 * @returns {"portrait"|"landscape"|"unknown"}
 */
export function getGalleryVideoLayout(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return GALLERY_VIDEO_LAYOUT_UNKNOWN;
  }
  return h > w ? GALLERY_VIDEO_LAYOUT_PORTRAIT : GALLERY_VIDEO_LAYOUT_LANDSCAPE;
}

/**
 * Distingue toque (abrir viewer) de swipe no carrossel.
 * @param {{ x: number, y: number, t: number }|null|undefined} start
 * @param {{ x: number, y: number, t: number }|null|undefined} end
 * @returns {boolean}
 */
export function isGalleryTapGesture(start, end) {
  if (!start || !end) return false;
  const dx = Math.abs(Number(end.x) - Number(start.x));
  const dy = Math.abs(Number(end.y) - Number(start.y));
  const dt = Number(end.t) - Number(start.t);
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(dt)) return false;
  if (dt < 0 || dt > GALLERY_TAP_MAX_MS) return false;
  return dx <= GALLERY_TAP_MAX_MOVE_PX && dy <= GALLERY_TAP_MAX_MOVE_PX;
}

/**
 * Ignora toques em botões, links e chrome da galeria.
 * @param {EventTarget|null|undefined} target
 * @returns {boolean}
 */
export function isGalleryChromeTarget(target) {
  if (!target || typeof target.closest !== "function") return false;
  return Boolean(target.closest("button, a, [data-gallery-chrome]"));
}

/**
 * Monta a trilha do hero: vídeo primeiro (se houver), depois fotos.
 * @param {Array<string|import("./photoGallery.js").GalleryPhoto>} [imagens]
 * @param {string|null|undefined} [videoUrl]
 * @param {string|null|undefined} [posterUrl]
 * @returns {GalleryMediaItem[]}
 */
export function buildHeroGalleryItems(imagens, videoUrl, posterUrl) {
  const photos = normalizeGalleryPhotos(imagens).map((photo) => ({
    type: GALLERY_MEDIA_PHOTO,
    ...photo,
  }));
  const src = String(videoUrl || "").trim();
  if (!src) return photos;

  const poster = String(posterUrl || photos[0]?.url || "").trim() || null;
  return [{ type: GALLERY_MEDIA_VIDEO, url: src, poster }, ...photos];
}

/**
 * Fotos para pré-carregamento (ignora o slide de vídeo).
 * @param {GalleryMediaItem[]} [items]
 * @returns {import("./photoGallery.js").GalleryPhoto[]}
 */
export function getGalleryPhotosForPreload(items) {
  return (items ?? [])
    .filter((item) => item?.type !== GALLERY_MEDIA_VIDEO && item?.url)
    .map((item) => ({
      url: item.url,
      ...(item.thumb ? { thumb: item.thumb } : {}),
      ...(item.blur ? { blur: item.blur } : {}),
    }));
}

/**
 * Índice na lista de fotos equivalente ao slide atual do hero.
 * @param {GalleryMediaItem[]} items
 * @param {number} currentIndex
 * @returns {number}
 */
export function getGalleryPhotoPreloadIndex(items, currentIndex) {
  const list = items ?? [];
  if (!list.length) return 0;

  const safeIndex = Math.min(Math.max(0, currentIndex), list.length - 1);
  if (list[safeIndex]?.type === GALLERY_MEDIA_VIDEO) return 0;

  const photosBefore = list
    .slice(0, safeIndex)
    .filter((item) => item?.type !== GALLERY_MEDIA_VIDEO).length;
  return photosBefore;
}
