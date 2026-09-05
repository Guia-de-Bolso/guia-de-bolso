"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Adiciona sombra/fade no shell sticky quando o conteúdo passa por baixo (IntersectionObserver).
 * Não altera layout — evita piscar do toggle display:none no scroll.
 * @returns {(node: HTMLDivElement | null) => void}
 */
export function useStickyShellRef() {
  const cleanupRef = useRef(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  return useCallback((shellEl) => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!shellEl) return;

    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.className = "sticky-shell-sentinel h-px w-full shrink-0";

    shellEl.insertAdjacentElement("afterend", sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => {
        shellEl.classList.toggle("is-stuck", !entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px" }
    );

    observer.observe(sentinel);
    shellEl.classList.remove("is-stuck");

    cleanupRef.current = () => {
      observer.disconnect();
      sentinel.remove();
      shellEl.classList.remove("is-stuck");
    };
  }, []);
}
