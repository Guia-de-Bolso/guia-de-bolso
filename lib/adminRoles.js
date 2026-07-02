/** Papéis possíveis na tabela `perfis`. */
export const ROLES = ["dev", "admin", "usuario", "estabelecimento"];

/** Papéis com acesso ao painel administrativo. */
export const ADMIN_ACCESS_ROLES = ["admin", "dev"];

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
  admin: "Acesso completo ao painel administrativo.",
  dev: "Administrador com permissões de desenvolvimento.",
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
  return ADMIN_ACCESS_ROLES.includes(role);
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
 * Contratos comerciais — somente administrador (dados sensíveis: CNPJ, PDFs, Asaas).
 * @param {string} [role]
 * @returns {boolean}
 */
export function canAccessContratosAdmin(role) {
  return normalizeRole(role) === "admin";
}
