"use client";

import { useEffect } from "react";

/**
 * Bloqueia scroll do body e fecha com Escape enquanto um bottom sheet está aberto.
 * No iOS usa position:fixed no body para evitar scroll da página por trás do sheet.
 * @param {boolean} isOpen
 * @param {() => void} onClose
 */
export function useBottomSheetBodyLock(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);
}
