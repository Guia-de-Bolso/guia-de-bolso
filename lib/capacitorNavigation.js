import { Capacitor } from "@capacitor/core";

/**
 * @returns {boolean}
 */
export function isCapacitorNative() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * Normaliza path para export estático com `trailingSlash: true`.
 * @param {string} href - ex. `/login?from=onboarding`
 * @returns {string}
 */
export function toCapacitorStaticHref(href) {
  const [rawPath = "/", rawQuery] = href.split("?");
  const path = rawPath.endsWith("/") ? rawPath : `${rawPath}/`;
  return rawQuery ? `${path}?${rawQuery}` : path;
}

/**
 * Navegação entre rotas no app nativo (bundle local, sem servidor RSC).
 * No browser usa o router do Next.js normalmente.
 * @param {import('next/navigation').AppRouterInstance} router
 * @param {string} href
 * @param {{ replace?: boolean }} [options]
 */
export function navigateAppPath(router, href, options = {}) {
  const { replace = false } = options;

  if (!isCapacitorNative()) {
    if (replace) router.replace(href);
    else router.push(href);
    return;
  }

  const target = toCapacitorStaticHref(href);
  if (replace) window.location.replace(target);
  else window.location.assign(target);
}
