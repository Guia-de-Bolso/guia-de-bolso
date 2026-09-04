"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { useBottomSheetBodyLock } from "@/hooks/useBottomSheetBodyLock";
import { useGalleryPhotoPreload } from "@/hooks/useGalleryPhotoPreload";
import {
  GALLERY_VIDEO_LAYOUT_PORTRAIT,
  getGalleryPhotoPreloadIndex,
  getGalleryPhotosForPreload,
  getGalleryVideoLayout,
  isGalleryVideoItem,
} from "@/lib/galleryMedia";
import {
  PHOTO_GALLERY_SLIDE_CLASS,
  PHOTO_GALLERY_TRACK_CLASS,
  scrollCarouselToIndex,
  useControlledPhotoCarousel,
} from "@/lib/horizontalCarousel";

/**
 * Vídeo em tela cheia: autoplay com som (o toque que abriu o viewer vale como gesto).
 * @param {object} props
 * @param {string} props.src
 * @param {string|null} [props.poster]
 * @param {string} props.alt
 * @param {boolean} props.isActive
 * @returns {import("react").JSX.Element}
 */
function ViewerVideoSlide({ src, poster, alt, isActive }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [layout, setLayout] = useState(() => getGalleryVideoLayout(0, 0));
  const isPortrait = layout === GALLERY_VIDEO_LAYOUT_PORTRAIT;

  useEffect(() => {
    setLayout(getGalleryVideoLayout(0, 0));
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const applyLayout = () => {
      setLayout(getGalleryVideoLayout(video.videoWidth, video.videoHeight));
    };

    if (video.videoWidth > 0 && video.videoHeight > 0) applyLayout();
    video.addEventListener("loadedmetadata", applyLayout);

    if (!isActive) {
      video.pause();
      return () => video.removeEventListener("loadedmetadata", applyLayout);
    }

    setPaused(false);
    video.play().catch(() => {});

    const onVisibility = () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      video.play().catch(() => {});
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      video.removeEventListener("loadedmetadata", applyLayout);
      document.removeEventListener("visibilitychange", onVisibility);
      video.pause();
    };
  }, [isActive, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  return (
    <div
      className={`${PHOTO_GALLERY_SLIDE_CLASS} flex items-center justify-center bg-black [container-type:size]`}
    >
      <div
        className={
          isPortrait
            ? "relative aspect-[9/16] h-[min(100%,calc(100cqi*16/9))] w-[min(100%,calc(100cqh*9/16))] overflow-hidden rounded-[1.75rem] bg-black"
            : "relative h-full w-full"
        }
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          loop
          playsInline
          preload={isActive ? "auto" : "metadata"}
          className={
            isPortrait
              ? "pointer-events-none absolute inset-0 h-full w-full object-cover"
              : "pointer-events-none h-full w-full object-contain"
          }
          aria-label={alt}
        />
      </div>
      {isActive ? (
        <div
          className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-0 right-0 z-10 flex justify-center gap-2"
          data-gallery-chrome
        >
          <button
            type="button"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              if (video.paused) {
                setPaused(false);
                video.play().catch(() => {});
                return;
              }
              setPaused(true);
              video.pause();
            }}
            className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
          >
            {paused ? "Reproduzir" : "Pausar"}
          </button>
          <button
            type="button"
            onClick={() => setMuted((current) => !current)}
            className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
            aria-label={muted ? "Ativar som" : "Silenciar"}
          >
            {muted ? "Som" : "Mudo"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Viewer imersivo de fotos e vídeo (tela cheia, swipe, Escape fecha).
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {import("@/lib/galleryMedia").GalleryMediaItem[]} props.items
 * @param {number} [props.initialIndex=0]
 * @param {string} props.nome
 * @param {string} [props.categoria]
 * @returns {import("react").JSX.Element|null}
 */
export default function GalleryMediaViewer({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  nome,
  categoria,
}) {
  const titleId = useId();
  const closeRef = useRef(null);
  const carouselRef = useRef(null);
  const list = items ?? [];
  const slideCount = isOpen ? list.length : 0;
  const current = useControlledPhotoCarousel(carouselRef, slideCount, {
    initialIndex: isOpen ? initialIndex : 0,
  });

  useBottomSheetBodyLock(isOpen, onClose);
  useGalleryPhotoPreload(
    getGalleryPhotosForPreload(list),
    getGalleryPhotoPreloadIndex(list, current)
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    closeRef.current?.focus();
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || list.length <= 1) return undefined;

    function handleKey(event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const element = carouselRef.current;
      if (!element) return;
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = Math.min(list.length - 1, Math.max(0, current + delta));
      scrollCarouselToIndex(element, next);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, current, list.length]);

  if (!isOpen || list.length === 0 || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="sr-only">
        Fotos e vídeos de {nome}
      </h2>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        data-gallery-chrome
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
          aria-label="Fechar"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        {list.length > 1 ? (
          <span className="pointer-events-none rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            {current + 1} / {list.length}
          </span>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
      </div>

      <div
        ref={carouselRef}
        className={`${PHOTO_GALLERY_TRACK_CLASS} min-h-0 flex-1`}
      >
        {list.map((item, index) =>
          isGalleryVideoItem(item) ? (
            <ViewerVideoSlide
              key={`viewer-video-${item.url}`}
              src={item.url}
              poster={item.poster}
              alt={`Vídeo de ${nome}`}
              isActive={index === current}
            />
          ) : (
            <div
              key={`viewer-photo-${item.url}-${index}`}
              className={`${PHOTO_GALLERY_SLIDE_CLASS} bg-black`}
            >
              <RemotePhoto
                src={item.url}
                thumbSrc={item.thumb}
                fullSrc={item.url}
                blurDataURL={item.blur}
                alt={nome}
                categoria={categoria}
                fill
                sizes="100vw"
                className="object-contain"
                priority={Math.abs(index - current) <= 1}
              />
            </div>
          )
        )}
      </div>
    </div>,
    document.body
  );
}
