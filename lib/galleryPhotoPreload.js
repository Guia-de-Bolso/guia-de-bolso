import { isCapacitorNative } from "./capacitorNavigation.js";
import { normalizeGalleryPhotos } from "./photoGallery.js";

/**
 * Pré-carrega fotos no cache do browser.
 * No Capacitor: thumbs primeiro; full para slide atual e adjacentes.
 * @param {Array<string|import('./photoGallery.js').GalleryPhoto>} photos
 * @param {number} [currentIndex=0]
 */
export function preloadGalleryPhotos(photos, currentIndex = 0) {
  if (typeof window === "undefined") return;

  const list = normalizeGalleryPhotos(photos);
  if (!list.length) return;

  const priorityIndices = new Set();
  priorityIndices.add(currentIndex);

  for (let delta = 1; delta < list.length; delta += 1) {
    const left = currentIndex - delta;
    const right = currentIndex + delta;
    if (left >= 0) priorityIndices.add(left);
    if (right < list.length) priorityIndices.add(right);
  }

  if (isCapacitorNative()) {
    list.forEach((photo, index) => {
      if (photo.thumb) preloadOne(photo.thumb);
    });
  }

  priorityIndices.forEach((index) => {
    preloadOne(list[index]?.url);
  });

  const deferred = list.filter((_, index) => !priorityIndices.has(index));
  if (!deferred.length) return;

  const runDeferred = () => {
    deferred.forEach((photo) => preloadOne(photo.url));
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(runDeferred, { timeout: 1500 });
  } else {
    window.setTimeout(runDeferred, 80);
  }
}

/**
 * @param {string} url
 */
function preloadOne(url) {
  if (!url) return;

  const img = new window.Image();
  img.decoding = "async";
  img.src = url;
}
