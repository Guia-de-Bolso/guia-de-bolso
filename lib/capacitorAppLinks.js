import { toCapacitorStaticHref } from "./capacitorNavigation.js";
import { resolveAppLinkPath } from "./appLinks.js";

/**
 * Navega para rota de conteúdo aberta via universal/app link no WebView nativo.
 * @param {string} rawUrl
 * @returns {boolean} true se navegou
 */
export function openCapacitorAppLink(rawUrl) {
  if (typeof window === "undefined") return false;

  const path = resolveAppLinkPath(rawUrl);
  if (!path) return false;

  const target = toCapacitorStaticHref(path);
  const current = `${window.location.pathname || "/"}${window.location.search || ""}`;

  if (current === target) return true;

  window.location.assign(target);
  return true;
}
