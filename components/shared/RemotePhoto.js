"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

const DEFAULT_QUALITY = 60;
const DEFAULT_FILL_SIZES = "(max-width: 768px) 100vw, 640px";

/**
 * Foto remota otimizada via `next/image` (WebP/AVIF + tamanho correto pela Vercel).
 *
 * @param {object} props
 * @param {string} props.src
 * @param {string} props.alt
 * @param {string} [props.className]
 * @param {boolean} [props.priority]
 * @param {boolean} [props.fill] - Preenche o container `relative` pai.
 * @param {number} [props.width] - Obrigatório quando `fill` é false.
 * @param {number} [props.height] - Obrigatório quando `fill` é false.
 * @param {string} [props.sizes] - Hint de largura para o otimizador (crítico em `fill`).
 * @param {number} [props.quality]
 * @param {() => void} [props.onLoad] - Chamado quando a imagem termina de carregar.
 * @returns {import("react").JSX.Element|null}
 */
export default function RemotePhoto({
  src,
  alt,
  className = "",
  priority = false,
  fill = false,
  width,
  height,
  sizes,
  quality = DEFAULT_QUALITY,
  onLoad,
}) {
  const loadNotifiedRef = useRef(false);

  useEffect(() => {
    loadNotifiedRef.current = false;
  }, [src]);

  const notifyLoaded = useCallback(() => {
    if (loadNotifiedRef.current) return;
    loadNotifiedRef.current = true;
    onLoad?.();
  }, [onLoad]);

  if (!src) return null;

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes || DEFAULT_FILL_SIZES}
        quality={quality}
        priority={priority}
        onLoad={notifyLoaded}
        onLoadingComplete={notifyLoaded}
        className={className}
      />
    );
  }

  if (!width || !height) {
    console.warn(
      "[RemotePhoto] `width` e `height` são obrigatórios quando `fill` é false."
    );
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes || `${width}px`}
      quality={quality}
      priority={priority}
      onLoad={notifyLoaded}
      onLoadingComplete={notifyLoaded}
      className={className}
    />
  );
}
