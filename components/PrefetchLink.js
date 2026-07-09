"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Link com prefetch agressivo no toque/hover (padrão do BottomNav).
 * @param {object} props
 * @param {string} props.href
 * @param {boolean} [props.prefetchOnInteraction=true]
 * @returns {import("react").JSX.Element}
 */
export default function PrefetchLink({
  href,
  prefetchOnInteraction = true,
  onTouchStart,
  onMouseEnter,
  onFocus,
  ...props
}) {
  const router = useRouter();

  const prefetchHref = useCallback(() => {
    if (!prefetchOnInteraction || !href) return;
    router.prefetch(href);
  }, [href, prefetchOnInteraction, router]);

  return (
    <Link
      href={href}
      prefetch
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
      {...props}
    />
  );
}
