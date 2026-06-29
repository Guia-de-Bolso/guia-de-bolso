"use client";

import Link from "next/link";
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
}) {
  const { offlineLimited } = useOfflineMode();
  const useDocumentNav = preferDocumentNav && offlineLimited;

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
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
