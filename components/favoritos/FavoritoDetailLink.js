"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useOfflineMode } from "@/components/OfflineModeProvider";

/**
 * Link para detalhe de favorito — offline usa navegação de documento (shell precacheado no SW).
 * @param {object} props
 * @param {string} props.href
 * @param {boolean} [props.preferDocumentNav]
 * @param {string} [props.className]
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").ReactElement}
 */
export default function FavoritoDetailLink({
  href,
  preferDocumentNav = false,
  className,
  children,
  onTouchStart,
  onMouseEnter,
  onFocus,
}) {
  const { offlineLimited } = useOfflineMode();
  const router = useRouter();
  const useDocumentNav = preferDocumentNav && offlineLimited;

  const prefetchHref = useCallback(() => {
    if (!href || useDocumentNav) return;
    router.prefetch(href);
  }, [href, router, useDocumentNav]);

  if (useDocumentNav) {
    return (
      <a
        href={href}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          window.location.assign(href);
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      prefetch
      className={className}
      onTouchStart={(event) => {
        prefetchHref();
        onTouchStart?.(event);
      }}
      onMouseEnter={(event) => {
        prefetchHref();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetchHref();
        onFocus?.(event);
      }}
    >
      {children}
    </Link>
  );
}
