"use client";

import RemotePhoto from "@/components/shared/RemotePhoto";
import { resolveCapacitorGallerySrc } from "@/lib/capacitorImage";
import { PHOTO_GALLERY_SLIDE_CLASS } from "@/lib/horizontalCarousel";
import {
  getCategoryPlaceholderHex,
  resolvePhotoBlurDataUrl,
} from "@/lib/imagePlaceholder";

/**
 * Slide de galeria com blur de fundo e carregamento prioritário perto do índice ativo.
 * @param {object} props
 * @param {string} props.src
 * @param {string} [props.thumbSrc]
 * @param {string} [props.blurDataURL]
 * @param {string} props.alt
 * @param {string} [props.categoria]
 * @param {number} props.index
 * @param {number} props.activeIndex
 * @param {number} props.total
 * @returns {import("react").JSX.Element}
 */
export default function GallerySlidePhoto({
  src,
  thumbSrc,
  blurDataURL,
  alt,
  categoria,
  index,
  activeIndex,
  total,
}) {
  const isActive = index === activeIndex;
  const isAdjacent = Math.abs(index - activeIndex) <= 1;
  const blurDataUrl = resolvePhotoBlurDataUrl({ blurDataURL, categoria });
  const placeholderHex = getCategoryPlaceholderHex(categoria);
  const displaySrc = resolveCapacitorGallerySrc({
    url: src,
    thumb: thumbSrc,
    isActive,
    isAdjacent,
  });

  return (
    <div className={PHOTO_GALLERY_SLIDE_CLASS}>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: placeholderHex }}
        aria-hidden
      />
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-95 blur-2xl"
        style={{ backgroundImage: `url("${blurDataUrl}")` }}
        aria-hidden
      />
      <RemotePhoto
        src={displaySrc}
        fullSrc={src}
        thumbSrc={thumbSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 640px"
        className="object-cover"
        blurDataURL={blurDataURL}
        categoria={categoria}
        loading="eager"
        priority={index === 0 || isActive || isAdjacent || total <= 8}
        fetchPriority={isActive ? "high" : "auto"}
      />
    </div>
  );
}
