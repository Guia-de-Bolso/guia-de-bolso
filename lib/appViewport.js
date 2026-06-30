import { isMarketingHost } from "./marketingHost.js";

/** Largura máxima da coluna mobile (alinhada a `max-w-md` / 28rem). */
export const APP_VIEWPORT_MAX_WIDTH = "28rem";

/**
 * Rotas no app nativo/web que usam layout full-width — sem coluna centralizada no iPad.
 * @type {readonly string[]}
 */
export const APP_VIEWPORT_SKIP_PREFIXES = ["/admin", "/landing", "/para-negocios"];

/**
 * Shell de coluna mobile no iPad: só no host do app (ex.: app.guiadebolso.app).
 * No marketing (guiadebolso.app), `/` é a landing full-width — não aplicar shell.
 * @param {string} pathname
 * @param {string|null|undefined} [host] - `window.location.hostname` no cliente.
 * @returns {boolean}
 */
export function shouldUseAppViewportShell(pathname, host = null) {
  const path = String(pathname ?? "/");
  const normalizedHost = String(host ?? "")
    .toLowerCase()
    .split(":")[0];

  if (normalizedHost && isMarketingHost(normalizedHost)) {
    return false;
  }

  return !APP_VIEWPORT_SKIP_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}
