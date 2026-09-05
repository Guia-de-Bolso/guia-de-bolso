/** Prefixo de rotas com shell offline via service worker. */
export const FAVORITOS_OFFLINE_PATH = "/favoritos";

/**
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePathname(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  return pathname.split("?")[0].replace(/\/$/, "") || "/";
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isFavoritosListPath(pathname) {
  return normalizePathname(pathname) === FAVORITOS_OFFLINE_PATH;
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isFavoritosDetailPath(pathname) {
  const path = normalizePathname(pathname);
  return path.startsWith(`${FAVORITOS_OFFLINE_PATH}/`);
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isFavoritosOfflinePath(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  return isFavoritosListPath(pathname) || isFavoritosDetailPath(pathname);
}

/**
 * Requisições de dados do App Router (RSC/prefetch) — não devem receber HTML da lista.
 * @param {Request} request
 * @returns {boolean}
 */
export function isNextRouterDataRequest(request) {
  if (!request || request.method !== "GET") return false;
  if (request.mode === "navigate") return false;

  if (request.headers.get("rsc") === "1") return true;
  if (request.headers.get("Next-Router-Prefetch") === "1") return true;

  const accept = request.headers.get("accept") || "";
  return accept.includes("text/x-component");
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
    if (rota?.id != null) paths.add(`${FAVORITOS_OFFLINE_PATH}/roteiro/${rota.id}`);
  }

  return [...paths];
}
