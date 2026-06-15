"use client";

import { useEffect } from "react";

/**
 * Bloqueia scroll do body e fecha com Escape enquanto um bottom sheet está aberto.
 * @param {boolean} isOpen
 * @param {() => void} onClose
 */
export function useBottomSheetBodyLock(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);
}
