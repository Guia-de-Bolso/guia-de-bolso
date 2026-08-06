import { canAccessDevAdmin } from "./adminRoles.js";

/**
 * @typedef {{ href: string, label: string }} AdminDashboardShortcut
 */

/**
 * Atalhos do hero do dashboard conforme o papel.
 * @param {string} [role]
 * @returns {AdminDashboardShortcut[]}
 */
export function getDashboardHeroShortcuts(role) {
  const operacao = [
    { href: "/admin/avaliacoes?tab=pendente", label: "Moderar avaliações" },
    { href: "/admin/locais", label: "Locais" },
    { href: "/admin/locais?status=em_analise", label: "Em análise" },
    { href: "/admin/atrativos", label: "Atrativos" },
  ];

  if (!canAccessDevAdmin(role)) {
    return operacao;
  }

  return [
    { href: "/admin/avaliacoes?tab=pendente", label: "Moderar avaliações" },
    { href: "/admin/locais", label: "Locais" },
    { href: "/admin/parceiros", label: "Parceiros" },
    { href: "/admin/logs", label: "Logs" },
  ];
}
