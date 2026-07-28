/**
 * Nome público do autor de avaliações e perfis.
 * Ordem: nome → e-mail (local) → telefone mascarado → Visitante.
 * @module lib/autorDisplayName
 */

export const AUTOR_NOME_FALLBACK = "Visitante";
export const AUTOR_NOME_MIN_LEN = 2;
export const AUTOR_NOME_MAX_LEN = 40;

const PLACEHOLDER_NOMES = new Set([
  "usuário",
  "usuario",
  "visitante",
  "user",
  "anonymous",
  "anônimo",
  "anonimo",
]);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlaceholderAutorNome(value) {
  const nome = String(value || "").trim().toLowerCase();
  return !nome || PLACEHOLDER_NOMES.has(nome);
}

/**
 * Últimos 4 dígitos, ex.: •••0933
 * @param {unknown} phone
 * @returns {string}
 */
export function maskPhoneForDisplay(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  return `•••${digits.slice(-4)}`;
}

/**
 * Parte local do e-mail (antes do @).
 * @param {unknown} email
 * @returns {string}
 */
export function emailLocalPart(email) {
  const raw = String(email || "").trim();
  if (!raw.includes("@")) return "";
  const local = raw.split("@")[0].trim();
  return local && !isPlaceholderAutorNome(local) ? local : "";
}

/**
 * Resolve o melhor nome de exibição disponível.
 * @param {{ nome?: unknown, email?: unknown, phone?: unknown, user?: import('@supabase/supabase-js').User|null }} input
 * @returns {string}
 */
export function resolveAutorDisplayName(input = {}) {
  const user = input.user || null;
  const nome =
    input.nome ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name;
  const email = input.email ?? user?.email;
  const phone = input.phone ?? user?.phone;

  if (!isPlaceholderAutorNome(nome)) {
    return String(nome).trim();
  }

  const fromEmail = emailLocalPart(email);
  if (fromEmail) return fromEmail;

  const fromPhone = maskPhoneForDisplay(phone);
  if (fromPhone) return fromPhone;

  return AUTOR_NOME_FALLBACK;
}

/**
 * Normaliza o texto digitado em "Como quer aparecer?".
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeAutorDisplayNameInput(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, AUTOR_NOME_MAX_LEN);
}

/**
 * @param {unknown} value
 * @returns {{ ok: true, nome: string } | { ok: false, error: string }}
 */
export function validateAutorDisplayNameInput(value) {
  const nome = normalizeAutorDisplayNameInput(value);
  if (nome.length < AUTOR_NOME_MIN_LEN) {
    return {
      ok: false,
      error: `Digite pelo menos ${AUTOR_NOME_MIN_LEN} caracteres para aparecer na avaliação.`,
    };
  }
  if (isPlaceholderAutorNome(nome)) {
    return {
      ok: false,
      error: "Escolha um nome para aparecer na avaliação.",
    };
  }
  return { ok: true, nome };
}
