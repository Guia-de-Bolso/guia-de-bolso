/** Rotas principais da bottom navigation (ordem de exibição). */
export const BOTTOM_NAV_ROUTES = [
  { href: "/", label: "Início" },
  { href: "/categorias", label: "Explorar" },
  { href: "/atrativos", label: "Atrativos" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/perfil", label: "Perfil" },
];

/** @type {readonly string[]} */
export const BOTTOM_NAV_HREFS = BOTTOM_NAV_ROUTES.map((item) => item.href);
