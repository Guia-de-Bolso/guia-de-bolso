/**
 * Preferências leves do painel admin (localStorage).
 */

export const ADMIN_SIDEBAR_COLLAPSED_KEY = "admin_sidebar_collapsed";
export const ADMIN_DASHBOARD_PERIOD_KEY = "admin_dashboard_period";

/** @typedef {"semana"|"mes"} AdminDashboardPeriod */

/**
 * @returns {boolean}
 */
export function getAdminSidebarCollapsed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {boolean} collapsed
 */
export function setAdminSidebarCollapsed(collapsed) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @returns {AdminDashboardPeriod}
 */
export function getAdminDashboardPeriod() {
  if (typeof window === "undefined") return "semana";
  try {
    const value = window.localStorage.getItem(ADMIN_DASHBOARD_PERIOD_KEY);
    return value === "mes" ? "mes" : "semana";
  } catch {
    return "semana";
  }
}

/**
 * @param {AdminDashboardPeriod|string} period
 */
export function setAdminDashboardPeriod(period) {
  if (typeof window === "undefined") return;
  const next = period === "mes" ? "mes" : "semana";
  try {
    window.localStorage.setItem(ADMIN_DASHBOARD_PERIOD_KEY, next);
  } catch {
    /* ignore */
  }
}
