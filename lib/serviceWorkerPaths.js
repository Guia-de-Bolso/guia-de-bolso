/** Prefixo de rotas com shell offline via service worker. */
export const FAVORITOS_OFFLINE_PATH = "/favoritos";

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isFavoritosOfflinePath(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  return path === FAVORITOS_OFFLINE_PATH || path.startsWith(`${FAVORITOS_OFFLINE_PATH}/`);
}

/**
 * Monta URLs de shell offline para lugares e atrativos favoritos.
 * @param {Array<{ id: string|number }>} lugares
 * @param {Array<{ id: string|number }>} atrativos
 * @returns {string[]}
 */
export function buildFavoritosPrecachePaths(lugares = [], atrativos = []) {
  const paths = new Set([FAVORITOS_OFFLINE_PATH]);

  for (const lugar of lugares) {
    if (lugar?.id != null) paths.add(`${FAVORITOS_OFFLINE_PATH}/lugar/${lugar.id}`);
  }

  for (const rota of atrativos) {
    if (rota?.id != null) paths.add(`${FAVORITOS_OFFLINE_PATH}/atrativo/${rota.id}`);
  }

  return [...paths];
}
