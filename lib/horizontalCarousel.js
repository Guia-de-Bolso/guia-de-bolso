import { useEffect, useState } from "react";

/** Classes do trilho horizontal genérico (home, etc.). */
export const CAROUSEL_TRACK_CLASS =
  "flex h-full snap-x snap-proximity overflow-x-auto overscroll-x-contain scrollbar-hide [-webkit-overflow-scrolling:touch]";

/** Trilho de galeria de fotos (lugar/rota): snap obrigatório, um slide por gesto com clamp JS. */
export const PHOTO_GALLERY_TRACK_CLASS =
  "flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-hide [-webkit-overflow-scrolling:touch] touch-pan-x";

/** Cada slide para em um snap por gesto (scroll-snap-stop: always). */
export const CAROUSEL_SLIDE_CLASS =
  "relative h-full w-full shrink-0 snap-center snap-always";

/** Slide de galeria de fotos — mesmo snap rígido em todos os heroes. */
export const PHOTO_GALLERY_SLIDE_CLASS = CAROUSEL_SLIDE_CLASS;

/**
 * Limita o índice alvo a no máximo ±maxDelta em relação ao índice do início do gesto.
 * @param {number} startIndex
 * @param {number} targetIndex
 * @param {number} [maxDelta=1]
 * @returns {number}
 */
export function clampCarouselIndex(startIndex, targetIndex, maxDelta = 1) {
  return Math.min(startIndex + maxDelta, Math.max(startIndex - maxDelta, targetIndex));
}

/**
 * Índice do slide visível com base na posição de scroll.
 * @param {HTMLDivElement | null} element
 * @param {{ indexThreshold?: number }} [options]
 * @returns {number}
 */
export function getCarouselSlideIndex(element, options = {}) {
  if (!element || element.clientWidth <= 0) return 0;

  const threshold = options.indexThreshold ?? 0.35;
  const slideWidth = element.clientWidth;
  const maxIndex = Math.max(0, Math.round(element.scrollWidth / slideWidth) - 1);
  const raw = element.scrollLeft / slideWidth;

  const index = raw - Math.floor(raw) >= threshold ? Math.ceil(raw) : Math.floor(raw);

  return Math.min(maxIndex, Math.max(0, index));
}

/**
 * @param {HTMLDivElement} element
 * @param {number} index
 */
export function scrollCarouselToIndex(element, index) {
  const slideWidth = element.clientWidth;
  if (slideWidth <= 0) return;

  const maxIndex = Math.max(0, Math.round(element.scrollWidth / slideWidth) - 1);
  const safeIndex = Math.min(maxIndex, Math.max(0, index));
  element.scrollTo({ left: safeIndex * slideWidth, behavior: "auto" });
}

/**
 * Sincroniza índice do carrossel no scrollend (e debounce curto durante scroll).
 * @param {HTMLDivElement} element
 * @param {(index: number) => void} onIndexChange
 * @param {{ indexThreshold?: number }} [options]
 * @returns {() => void}
 */
export function bindCarouselScrollIndex(element, onIndexChange, options = {}) {
  let debounceId = 0;

  const sync = () => {
    onIndexChange(getCarouselSlideIndex(element, options));
  };

  const onScroll = () => {
    window.clearTimeout(debounceId);
    debounceId = window.setTimeout(sync, 120);
  };

  element.addEventListener("scroll", onScroll, { passive: true });
  element.addEventListener("scrollend", sync, { passive: true });

  sync();

  return () => {
    window.clearTimeout(debounceId);
    element.removeEventListener("scroll", onScroll);
    element.removeEventListener("scrollend", sync);
  };
}

/**
 * Galeria de fotos: no fim de cada gesto, no máximo ±1 slide em relação ao índice no touch/pointer down.
 * @param {HTMLDivElement} element
 * @param {(index: number) => void} onIndexChange
 * @param {{ indexThreshold?: number, maxDeltaPerGesture?: number }} [options]
 * @returns {() => void}
 */
export function bindControlledPhotoCarousel(element, onIndexChange, options = {}) {
  const indexOpts = { indexThreshold: options.indexThreshold ?? 0.35 };
  const maxDelta = options.maxDeltaPerGesture ?? 1;

  let committedIndex = getCarouselSlideIndex(element, indexOpts);
  let gestureStartIndex = committedIndex;
  let gestureActive = false;
  let debounceId = 0;
  let settleFallbackId = 0;

  const publishIndex = (index) => {
    if (index === committedIndex) return;
    committedIndex = index;
    onIndexChange(index);
  };

  const cancelSettleFallback = () => {
    window.clearTimeout(settleFallbackId);
    settleFallbackId = 0;
  };

  const settleGesture = () => {
    cancelSettleFallback();
    if (!gestureActive) return;
    gestureActive = false;

    const rawIndex = getCarouselSlideIndex(element, indexOpts);
    const clamped = clampCarouselIndex(gestureStartIndex, rawIndex, maxDelta);

    if (clamped !== rawIndex) {
      scrollCarouselToIndex(element, clamped);
    }

    publishIndex(clamped);
  };

  const onGestureStart = () => {
    cancelSettleFallback();
    gestureActive = true;
    gestureStartIndex = committedIndex;
  };

  const scheduleSettleFallback = () => {
    if (!gestureActive) return;
    cancelSettleFallback();
    settleFallbackId = window.setTimeout(settleGesture, 120);
  };

  const onScroll = () => {
    if (gestureActive) return;

    window.clearTimeout(debounceId);
    debounceId = window.setTimeout(() => {
      const idx = getCarouselSlideIndex(element, indexOpts);
      publishIndex(idx);
    }, 120);
  };

  const onScrollEnd = () => {
    settleGesture();
  };

  const onGestureEnd = () => {
    scheduleSettleFallback();
  };

  onIndexChange(committedIndex);

  element.addEventListener("pointerdown", onGestureStart, { passive: true });
  element.addEventListener("touchstart", onGestureStart, { passive: true });
  element.addEventListener("touchend", onGestureEnd, { passive: true });
  element.addEventListener("pointerup", onGestureEnd, { passive: true });
  element.addEventListener("pointercancel", onGestureEnd, { passive: true });
  element.addEventListener("scroll", onScroll, { passive: true });
  element.addEventListener("scrollend", onScrollEnd, { passive: true });

  return () => {
    window.clearTimeout(debounceId);
    cancelSettleFallback();
    element.removeEventListener("pointerdown", onGestureStart);
    element.removeEventListener("touchstart", onGestureStart);
    element.removeEventListener("touchend", onGestureEnd);
    element.removeEventListener("pointerup", onGestureEnd);
    element.removeEventListener("pointercancel", onGestureEnd);
    element.removeEventListener("scroll", onScroll);
    element.removeEventListener("scrollend", onScrollEnd);
  };
}

/**
 * Hook para carrossel horizontal (sem limite por gesto).
 * @param {import("react").RefObject<HTMLDivElement | null>} carouselRef
 * @param {number} [slideCount=0]
 * @param {{ indexThreshold?: number }} [options]
 * @returns {number}
 */
export function useCarouselScrollIndex(carouselRef, slideCount = 0, options = {}) {
  const [index, setIndex] = useState(0);
  const threshold = options.indexThreshold ?? 0.35;

  useEffect(() => {
    setIndex(0);
    const element = carouselRef.current;
    if (element) element.scrollLeft = 0;
  }, [slideCount, carouselRef]);

  useEffect(() => {
    const element = carouselRef.current;
    if (!element || slideCount <= 1) return undefined;
    return bindCarouselScrollIndex(element, setIndex, { indexThreshold: threshold });
  }, [carouselRef, slideCount, threshold]);

  return index;
}

/**
 * Hook para galeria de fotos (lugar/rota): no máximo ±1 slide por gesto.
 * @param {import("react").RefObject<HTMLDivElement | null>} carouselRef
 * @param {number} [slideCount=0]
 * @param {{ indexThreshold?: number, maxDeltaPerGesture?: number }} [options]
 * @returns {number}
 */
export function useControlledPhotoCarousel(carouselRef, slideCount = 0, options = {}) {
  const [index, setIndex] = useState(0);
  const threshold = options.indexThreshold ?? 0.35;
  const maxDelta = options.maxDeltaPerGesture ?? 1;

  useEffect(() => {
    setIndex(0);
    const element = carouselRef.current;
    if (element) element.scrollLeft = 0;
  }, [slideCount, carouselRef]);

  useEffect(() => {
    const element = carouselRef.current;
    if (!element || slideCount <= 1) return undefined;
    return bindControlledPhotoCarousel(element, setIndex, {
      indexThreshold: threshold,
      maxDeltaPerGesture: maxDelta,
    });
  }, [carouselRef, slideCount, threshold, maxDelta]);

  return index;
}
