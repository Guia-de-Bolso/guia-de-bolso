import { canAccessContratosAdmin } from "@/lib/adminRoles";

/**
 * Links e ícones SVG do menu admin.
 * @typedef {{ href: string, label: string, icon: string, adminOnly?: boolean }} AdminNavLink
 */

/** @type {AdminNavLink[]} */
export const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/ia", label: "IA & Custos", icon: "ia" },
  { href: "/admin/despesas", label: "Despesas", icon: "despesas" },
  { href: "/admin/locais", label: "Locais", icon: "locais" },
  { href: "/admin/parceiros", label: "Parceiros", icon: "parceiros" },
  { href: "/admin/contratos", label: "Contratos", icon: "contratos", adminOnly: true },
  { href: "/admin/atrativos", label: "Atrativos", icon: "rotas" },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: "avaliacoes" },
  { href: "/admin/feedback", label: "Feedback", icon: "feedback" },
  { href: "/admin/relatorios", label: "Relatórios", icon: "relatorios" },
  { href: "/admin/usuarios", label: "Usuários", icon: "usuarios" },
  { href: "/admin/logs", label: "Logs", icon: "logs" },
  { href: "/admin/taxonomia", label: "Taxonomia", icon: "taxonomia" },
];

/**
 * @param {string} [role]
 * @returns {AdminNavLink[]}
 */
export function getVisibleAdminNavLinks(role) {
  return ADMIN_NAV_LINKS.filter(
    (link) => !link.adminOnly || canAccessContratosAdmin(role)
  );
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
 * @param {object} props
 * @param {string} props.name
 * @param {string} [props.className]
 * @returns {import("react").JSX.Element}
 */
export function AdminNavIcon({ name, className = "h-5 w-5" }) {
  const shared = {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.75,
    "aria-hidden": true,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...shared}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h4v12H4V6zm6 0h4v8h-4V6zm6 0h4v14h-4V6z" />
        </svg>
      );
    case "ia":
      return (
        <svg {...shared}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 17V7m6 10V4m6 13v-7m4 7V9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18" />
        </svg>
      );
    case "despesas":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
          />
        </svg>
      );
    case "locais":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z"
          />
        </svg>
      );
    case "parceiros":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
      );
    case "contratos":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "rotas":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.553-1.948L12 2l7.447 2.67A2 2 0 0121 6.618v8.764a2 2 0 01-1.553 1.948L15 20"
          />
        </svg>
      );
    case "avaliacoes":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3.5l2.09 4.24 4.68.68-3.385 3.3.799 4.66L12 14.9l-4.174 2.19.799-4.66-3.385-3.3 4.68-.68L12 3.5z"
          />
        </svg>
      );
    case "feedback":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M8 14h.01M12 14h.01M12 10h.01M16 10h.01M16 14h.01M4 6h16v12H4V6z"
          />
        </svg>
      );
    case "destaques":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      );
    case "usuarios":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M12 11a3 3 0 100-6 3 3 0 000 6zm8 8v-1a3 3 0 00-2-2.83M16 4.17a3 3 0 010 5.66"
          />
        </svg>
      );
    case "relatorios":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17v-6m3 6V7m3 10v-4M4 5h16v14H4V5z"
          />
        </svg>
      );
    case "logs":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      );
    case "taxonomia":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      );
    case "menu":
      return (
        <svg {...shared}>
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "collapse":
      return (
        <svg {...shared}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      );
    case "home":
      return (
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
          />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
  }
}

/**
 * @param {string} [nome]
 * @returns {string}
 */
export function getAdminInitials(nome) {
  return String(nome || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
