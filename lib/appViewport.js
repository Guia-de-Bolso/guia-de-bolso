/** Largura máxima da coluna mobile (alinhada a `max-w-md` / 28rem). */
export const APP_VIEWPORT_MAX_WIDTH = "28rem";

/**
 * Rotas que usam layout full-width (marketing, admin) — sem coluna centralizada no iPad.
 * @type {readonly string[]}
 */
export const APP_VIEWPORT_SKIP_PREFIXES = ["/admin", "/landing", "/para-negocios"];

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function shouldUseAppViewportShell(pathname) {
  const path = String(pathname ?? "/");
  return !APP_VIEWPORT_SKIP_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}
