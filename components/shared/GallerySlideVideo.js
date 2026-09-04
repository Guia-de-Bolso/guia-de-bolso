"use client";

import { useEffect, useRef, useState } from "react";
import { PHOTO_GALLERY_SLIDE_CLASS } from "@/lib/horizontalCarousel";
import { getCategoryPlaceholderHex } from "@/lib/imagePlaceholder";

/**
 * Slide de vídeo no hero: loop mudo, sem controles nativos (o swipe fica no carrossel).
 * @param {object} props
 * @param {string} props.src
 * @param {string|null} [props.poster]
 * @param {string} props.alt
 * @param {string} [props.categoria]
 * @param {boolean} props.isActive
 * @returns {import("react").JSX.Element}
 */
export default function GallerySlideVideo({
  src,
  poster = null,
  alt,
  categoria,
  isActive,
}) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const placeholderHex = getCategoryPlaceholderHex(categoria);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!isActive || reduceMotion) {
      video.pause();
      return undefined;
    }

    const play = () => {
      video.play().catch(() => {});
    };

    play();

    const onVisibility = () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      play();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      video.pause();
    };
  }, [isActive, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!isActive) setMuted(true);
  }, [isActive]);

  return (
    <div className={PHOTO_GALLERY_SLIDE_CLASS}>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: placeholderHex }}
        aria-hidden
      />
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        muted
        loop
        playsInline
        preload={isActive ? "auto" : "metadata"}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        aria-label={alt}
      />
      {isActive ? (
        <button
          type="button"
          onClick={() => setMuted((current) => !current)}
          className="absolute left-4 top-[max(4.75rem,calc(env(safe-area-inset-top)+3.25rem))] z-10 flex h-9 items-center rounded-full bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur-sm"
          aria-label={muted ? "Ativar som do vídeo" : "Silenciar vídeo"}
        >
          {muted ? "Som" : "Mudo"}
        </button>
      ) : null}
    </div>
  );
}
