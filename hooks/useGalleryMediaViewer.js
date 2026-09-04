"use client";

import { useCallback, useRef, useState } from "react";
import { isGalleryChromeTarget, isGalleryTapGesture } from "@/lib/galleryMedia";

/**
 * Toque no carrossel abre o viewer; swipe não abre.
 * @param {number} [currentIndex=0]
 */
export function useGalleryMediaViewer(currentIndex = 0, enabled = true) {
  const [isOpen, setIsOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const tapStartRef = useRef(null);
  const indexRef = useRef(currentIndex);
  indexRef.current = Math.max(0, Number(currentIndex) || 0);

  const openAt = useCallback((index) => {
    setStartIndex(Math.max(0, Number(index) || 0));
    setIsOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const carouselPointerHandlers = {
    onPointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isGalleryChromeTarget(event.target)) return;
      tapStartRef.current = { x: event.clientX, y: event.clientY, t: Date.now() };
    },
    onPointerUp(event) {
      const start = tapStartRef.current;
      tapStartRef.current = null;
      if (!start) return;
      if (isGalleryChromeTarget(event.target)) return;
      const end = { x: event.clientX, y: event.clientY, t: Date.now() };
      if (!isGalleryTapGesture(start, end)) return;
      if (!enabled) return;
      openAt(indexRef.current);
    },
    onPointerCancel() {
      tapStartRef.current = null;
    },
  };

  return {
    isOpen,
    startIndex,
    closeViewer,
    carouselPointerHandlers,
  };
}
