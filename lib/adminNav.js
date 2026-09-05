import { canAccessDevAdmin } from "./adminRoles.js";

/**
 * @typedef {{ href: string, label: string, icon: string, devOnly?: boolean }} AdminNavLink
 * @typedef {{
 *   id: string,
 *   label: string,
 *   collapsible?: boolean,
 *   defaultCollapsed?: boolean,
 *   links: AdminNavLink[],
 * }} AdminNavGroup
 */

/** @type {AdminNavGroup[]} */
export const ADMIN_NAV_GROUPS = [
  {
    id: "operacao",
    label: "Operação",
    links: [
      { href: "/admin", label: "Dashboard", icon: "dashboard" },
      { href: "/admin/locais", label: "Locais", icon: "locais" },
      { href: "/admin/roteiros", label: "Roteiros", icon: "rotas" },
      { href: "/admin/avaliacoes", label: "Avaliações", icon: "avaliacoes" },
      { href: "/admin/relatorios", label: "Relatórios", icon: "relatorios" },
      { href: "/admin/kpis", label: "KPIs lançamento", icon: "relatorios" },
      { href: "/admin/abordagem", label: "Fila de abordagem", icon: "parceiros" },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    links: [
      { href: "/admin/parceiros", label: "Parceiros", icon: "parceiros", devOnly: true },
      { href: "/admin/contratos", label: "Contratos", icon: "contratos", devOnly: true },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    collapsible: true,
    defaultCollapsed: true,
    links: [
      { href: "/admin/usuarios", label: "Usuários", icon: "usuarios", devOnly: true },
      { href: "/admin/feedback", label: "Feedback", icon: "feedback", devOnly: true },
      { href: "/admin/logs", label: "Logs", icon: "logs", devOnly: true },
      { href: "/admin/taxonomia", label: "Taxonomia", icon: "taxonomia", devOnly: true },
      { href: "/admin/ia", label: "IA & Custos", icon: "ia", devOnly: true },
      { href: "/admin/despesas", label: "Despesas", icon: "despesas", devOnly: true },
    ],
  },
];

/** Lista plana (compat / helpers). */
export const ADMIN_NAV_LINKS = ADMIN_NAV_GROUPS.flatMap((group) => group.links);

/**
 * @param {string} [role]
 * @returns {AdminNavLink[]}
 */
export function getVisibleAdminNavLinks(role) {
  return ADMIN_NAV_LINKS.filter((link) => !link.devOnly || canAccessDevAdmin(role));
}

/**
 * Grupos com links filtrados pelo papel; omite grupos vazios.
 * @param {string} [role]
 * @returns {AdminNavGroup[]}
 */
export function getVisibleAdminNavGroups(role) {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => !link.devOnly || canAccessDevAdmin(role)),
  })).filter((group) => group.links.length > 0);
}

/**
 * @param {string} pathname
 * @param {string} href
 * @returns {boolean}
 */
export function isAdminNavActive(pathname, href) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

/**
 * @param {AdminNavGroup} group
 * @param {string} pathname
 * @returns {boolean}
 */
export function isAdminNavGroupActive(group, pathname) {
  return group.links.some((link) => isAdminNavActive(pathname, link.href));
}

/**
 * Grupo colapsável começa fechado, exceto se a rota atual estiver nele.
 * @param {AdminNavGroup} group
 * @param {string} pathname
 * @returns {boolean}
 */
export function shouldAdminNavGroupStartOpen(group, pathname) {
  if (!group.collapsible) return true;
  if (isAdminNavGroupActive(group, pathname)) return true;
  return !group.defaultCollapsed;
}
