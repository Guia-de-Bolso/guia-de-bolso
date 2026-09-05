/**
 * URLs públicas e admin dos roteiros curados (tabela `rotas`).
 * A API continua em `/api/atrativos` para não colidir com `/api/roteiro` (IA).
 * @module lib/roteirosPaths
 */

export const ROTEIROS_PATH = "/roteiros";
export const ADMIN_ROTEIROS_PATH = "/admin/roteiros";
export const ADMIN_ROTEIROS_NOVA_PATH = `${ADMIN_ROTEIROS_PATH}/nova`;

/**
 * @param {string|number} id
 * @returns {string}
 */
export function roteiroDetalhePath(id) {
  return `${ROTEIROS_PATH}/${id}`;
}

/**
 * @param {string|number} id
 * @returns {string}
 */
export function adminRoteiroEditarPath(id) {
  return `${ADMIN_ROTEIROS_PATH}/${id}/editar`;
}

/**
 * @param {string|number} id
 * @returns {string}
 */
export function favoritoRoteiroPath(id) {
  return `/favoritos/roteiro/${id}`;
}

/**
 * Lista ou detalhe de roteiro (inclui URLs legadas `/atrativos`).
 * @param {string|null|undefined} pathname
 * @returns {boolean}
 */
export function isRoteirosPathname(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  const path = pathname.split("?")[0];
  return (
    path === ROTEIROS_PATH ||
    path.startsWith(`${ROTEIROS_PATH}/`) ||
    path === "/atrativos" ||
    path.startsWith("/atrativos/")
  );
}
