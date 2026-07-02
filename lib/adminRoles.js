/** Papéis possíveis na tabela `perfis`. */
export const ROLES = ["dev", "admin", "usuario", "estabelecimento"];

/** Papéis com acesso ao painel administrativo. */
export const ADMIN_ACCESS_ROLES = ["admin", "dev"];

/**
 * Rotas do painel restritas ao role `dev` (dados sensíveis / infraestrutura).
 * @type {readonly string[]}
 */
export const DEV_ONLY_ADMIN_PATHS = [
  "/admin/ia",
  "/admin/despesas",
  "/admin/parceiros",
  "/admin/contratos",
  "/admin/feedback",
  "/admin/usuarios",
  "/admin/logs",
  "/admin/taxonomia",
];

/** Rótulos em português para a UI admin. */
export const ROLE_LABELS = {
  usuario: "Usuário",
  admin: "Administrador",
  dev: "Desenvolvedor",
  estabelecimento: "Estabelecimento",
};

/** Descrições curtas para confirmação de alteração de papel. */
export const ROLE_DESCRIPTIONS = {
  usuario: "Acesso normal ao app.",
  admin: "Painel operacional (locais, avaliações, atrativos, relatórios).",
  dev: "Acesso completo ao painel administrativo e ao app.",
  estabelecimento: "Conta de parceiro (portal em breve).",
};

/**
 * Classes Tailwind por papel para chips na UI.
 * @type {Record<string, string>}
 */
export const ROLE_CHIP_STYLES = {
  dev: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  usuario: "bg-gray-100 text-gray-500",
  estabelecimento: "bg-orange-100 text-orange-700",
};

/**
 * Verifica se o papel tem permissão para acessar `/admin`.
 * @param {string} [role]
 * @returns {boolean}
 */
export function canAccessAdmin(role) {
  return ADMIN_ACCESS_ROLES.includes(normalizeRole(role));
}

/**
 * Role `dev` — acesso total ao painel (inclui áreas sensíveis).
 * @param {string} [role]
 * @returns {boolean}
 */
export function isDevRole(role) {
  return normalizeRole(role) === "dev";
}

/**
 * @param {string} [role]
 * @returns {boolean}
 */
export function canAccessDevAdmin(role) {
  return isDevRole(role);
}

/**
 * Verifica se o caminho pertence a uma seção exclusiva de `dev`.
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function isDevOnlyAdminPath(pathname) {
  if (!pathname) return false;
  return DEV_ONLY_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

/**
 * Verifica se o papel pode acessar uma rota específica do painel admin.
 * @param {string} [role]
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function canAccessAdminSection(role, pathname) {
  if (!canAccessAdmin(role)) return false;
  if (isDevOnlyAdminPath(pathname)) return canAccessDevAdmin(role);
  return true;
}

/**
 * Normaliza papel legado (`user` → `usuario`).
 * @param {string} [role]
 * @returns {string}
 */
export function normalizeRole(role) {
  if (!role || role === "user") return "usuario";
  return role;
}

/**
 * Retorna classes Tailwind do chip de papel do usuário.
 * @param {string} [role]
 * @returns {string}
 */
export function getRoleChipClass(role) {
  const normalized = normalizeRole(role);
  return ROLE_CHIP_STYLES[normalized] || "bg-gray-100 text-gray-500";
}

/**
 * Rótulo do papel em português.
 * @param {string} [role]
 * @returns {string}
 */
export function getRoleLabel(role) {
  const normalized = normalizeRole(role);
  return ROLE_LABELS[normalized] || normalized;
}

/**
 * Descrição do papel para modais de confirmação.
 * @param {string} [role]
 * @returns {string}
 */
export function getRoleDescription(role) {
  const normalized = normalizeRole(role);
  return ROLE_DESCRIPTIONS[normalized] || "";
}

/**
 * @param {string} [role]
 * @returns {boolean}
 */
export function isAdminTeamRole(role) {
  return ADMIN_ACCESS_ROLES.includes(normalizeRole(role));
}

/**
 * Contratos comerciais e demais áreas sensíveis — somente `dev`.
 * @param {string} [role]
 * @returns {boolean}
 */
export function canAccessContratosAdmin(role) {
  return canAccessDevAdmin(role);
}
