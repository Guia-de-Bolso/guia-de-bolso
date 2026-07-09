"use client";

import { useEffect } from "react";
import { preloadGalleryPhotos } from "@/lib/galleryPhotoPreload";

/**
 * Pré-carrega fotos da galeria ao montar e ao trocar de slide.
 * @param {Array<string|import('@/lib/photoGallery').GalleryPhoto>} photos
 * @param {number} [currentIndex=0]
 */
export function useGalleryPhotoPreload(photos, currentIndex = 0) {
  const key = (photos ?? [])
    .map((photo) => (typeof photo === "string" ? photo : photo?.url))
    .filter(Boolean)
    .join("|");

  useEffect(() => {
    if (!key) return;
    preloadGalleryPhotos(photos, currentIndex);
  }, [key, photos, currentIndex]);
}
