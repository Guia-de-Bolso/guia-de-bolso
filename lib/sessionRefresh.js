/** Renova o JWT no middleware se faltar menos que isto. */
export const AUTH_REFRESH_WINDOW_MS = 5 * 60 * 1000;

/**
 * Rotas que ainda validam a sessão no Auth server (admin e APIs de IA/cota).
 * @param {string} pathname
 * @returns {boolean}
 */
export function isStrictAuthPath(pathname) {
  const path = String(pathname || "").split("?")[0] || "/";
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api/admin") ||
    path.startsWith("/api/buscar") ||
    path.startsWith("/api/roteiro") ||
    path.startsWith("/api/uso-premium")
  );
}

/**
 * @param {{ expires_at?: number }|null|undefined} session
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function sessionNeedsRefresh(session, nowMs = Date.now()) {
  if (!session) return false;
  const expiresAtSec = Number(session.expires_at);
  if (!Number.isFinite(expiresAtSec) || expiresAtSec <= 0) return true;
  return expiresAtSec * 1000 - nowMs < AUTH_REFRESH_WINDOW_MS;
}

/**
 * Evita `getUser()` (ida ao Auth na us-west-2) em navegação pública com JWT ainda válido.
 * @param {string} pathname
 * @param {{ expires_at?: number }|null|undefined} session
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function shouldRefreshAuthWithServer(pathname, session, nowMs = Date.now()) {
  if (!session) return false;
  if (isStrictAuthPath(pathname)) return true;
  return sessionNeedsRefresh(session, nowMs);
}
