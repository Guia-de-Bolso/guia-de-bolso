"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isCapacitorNative } from "@/lib/capacitorNavigation";
import { resolvePhotoBlurDataUrl } from "@/lib/imagePlaceholder";

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
 * @param {string} [props.categoria] - Cor dominante do placeholder blur.
 * @param {string} [props.blurDataURL] - Blur explícito (sobrescreve categoria).
 * @param {string} [props.thumbSrc] - Thumb para progressive load no Capacitor.
 * @param {string} [props.fullSrc] - URL full quando `src` é thumb no nativo.
 * @param {boolean} [props.placeholderBlur=true] - Ativa blur-up estilo Airbnb.
 * @param {"lazy"|"eager"} [props.loading]
 * @param {"high"|"low"|"auto"} [props.fetchPriority]
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
  categoria,
  blurDataURL,
  thumbSrc,
  fullSrc,
  placeholderBlur = true,
  loading,
  fetchPriority,
  onLoad,
}) {
  const loadNotifiedRef = useRef(false);
  const [showFullOnNative, setShowFullOnNative] = useState(false);

  const resolvedBlur = useMemo(
    () => resolvePhotoBlurDataUrl({ blurDataURL, categoria }),
    [blurDataURL, categoria]
  );

  const nativeProgressive =
    isCapacitorNative() &&
    Boolean(fullSrc && thumbSrc && fullSrc !== thumbSrc && src === thumbSrc);

  useEffect(() => {
    loadNotifiedRef.current = false;
    setShowFullOnNative(false);
  }, [src, fullSrc, thumbSrc]);

  useEffect(() => {
    if (!nativeProgressive) return;
    const full = fullSrc;
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => setShowFullOnNative(true);
    img.src = full;
  }, [nativeProgressive, fullSrc]);

  const displaySrc =
    nativeProgressive && showFullOnNative && fullSrc ? fullSrc : src;

  const notifyLoaded = useCallback(() => {
    if (loadNotifiedRef.current) return;
    loadNotifiedRef.current = true;
    onLoad?.();
  }, [onLoad]);

  if (!src) return null;

  const imagePlaceholder = placeholderBlur
    ? { placeholder: "blur", blurDataURL: resolvedBlur }
    : {};

  const loadingProps = loading ? { loading } : {};
  const fetchPriorityProps = fetchPriority ? { fetchPriority } : {};
  const imageSrc = displaySrc;

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes || DEFAULT_FILL_SIZES}
        quality={quality}
        priority={priority}
        onLoad={notifyLoaded}
        onLoadingComplete={notifyLoaded}
        className={className}
        {...imagePlaceholder}
        {...loadingProps}
        {...fetchPriorityProps}
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
      {...imagePlaceholder}
      {...loadingProps}
      {...fetchPriorityProps}
    />
  );
}
