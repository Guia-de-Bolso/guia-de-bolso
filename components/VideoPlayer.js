"use client";

import { useRef } from "react";

/**
 * Player de vídeo com controles nativos e botão de tela cheia.
 * @param {object} props
 * @param {string} props.src
 * @param {string} [props.poster]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 * @returns {import("react").JSX.Element}
 */
export default function VideoPlayer({ src, poster, ariaLabel = "Vídeo", className = "" }) {
  const videoRef = useRef(null);

  /**
   * Entra em tela cheia (Safari iOS usa API proprietária no elemento video).
   */
  function handleFullscreen() {
    const video = videoRef.current;
    if (!video) return;

    if (typeof video.webkitEnterFullscreen === "function") {
      video.webkitEnterFullscreen();
      return;
    }

    const request =
      video.requestFullscreen?.bind(video) ||
      video.webkitRequestFullscreen?.bind(video);

    request?.().catch(() => {});
  }

  return (
    <div className={`relative bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        preload="metadata"
        poster={poster || undefined}
        className="aspect-video w-full bg-black object-contain"
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={handleFullscreen}
        className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75"
        aria-label="Assistir em tela cheia"
        title="Tela cheia"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      </button>
    </div>
  );
}
