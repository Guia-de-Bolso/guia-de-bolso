/** Rota da lista de favoritos (única aba liberada offline). */
export const FAVORITOS_OFFLINE_NAV_HREF = "/favoritos";

/** Mensagem ao tocar em abas bloqueadas sem rede. */
export const OFFLINE_NAV_BLOCKED_MESSAGE =
  "Você está sem internet. Por enquanto, só os lugares e trilhas que você favoritou antes estão disponíveis. Quando a rede voltar, o restante do guia será liberado.";

/**
 * Rotas permitidas no modo offline (lista + detalhes salvos).
 * @param {string} pathname
 * @returns {boolean}
 */
export function isFavoritosOfflineAllowedPath(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  return path === FAVORITOS_OFFLINE_NAV_HREF || path.startsWith(`${FAVORITOS_OFFLINE_NAV_HREF}/`);
}

/**
 * Home do app (Início) — online abre aqui; offline redireciona para favoritos.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isAppHomePath(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  return path === "/" || path === "/home";
}

/**
 * @param {string} href
 * @returns {boolean}
 */
export function isOfflineNavHrefAllowed(href) {
  return href === FAVORITOS_OFFLINE_NAV_HREF;
}
