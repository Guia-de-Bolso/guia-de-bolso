/**
 * Indica se o navegador reporta conexão ativa.
 * @returns {boolean}
 */
export function isBrowserOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}
