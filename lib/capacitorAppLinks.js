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

  const current = `${window.location.pathname || "/"}${window.location.search || ""}`;
  const normalizedCurrent = current.replace(/\/$/, "") || "/";
  const normalizedTarget = path.split("?")[0].replace(/\/$/, "") || "/";

  if (normalizedCurrent === normalizedTarget && current === path) return true;

  window.location.assign(path);
  return true;
}
