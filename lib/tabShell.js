import { BOTTOM_NAV_HREFS } from "./bottomNavRoutes.js";

/**
 * @typedef {{ root: string|null, isRoot: boolean }} BottomNavTabResolution
 */

/**
 * Resolve qual aba da bottom nav corresponde ao pathname e se é a rota raiz (cacheável).
 * Rotas aninhadas (ex.: /perfil/editar) retornam `isRoot: false`.
 * @param {string|null|undefined} pathname
 * @returns {BottomNavTabResolution}
 */
export function resolveBottomNavTab(pathname) {
  if (!pathname) return { root: null, isRoot: false };

  for (const href of BOTTOM_NAV_HREFS) {
    if (href === "/") {
      if (pathname === "/") return { root: "/", isRoot: true };
      continue;
    }

    if (pathname === href) return { root: href, isRoot: true };
    if (pathname.startsWith(`${href}/`)) return { root: href, isRoot: false };
  }

  return { root: null, isRoot: false };
}

/**
 * @param {string|null|undefined} pathname
 * @returns {boolean}
 */
export function isBottomNavRoot(pathname) {
  return resolveBottomNavTab(pathname).isRoot;
}
