/** Origens válidas para cadastro na lista de espera. */
export const WAITLIST_ORIGINS = new Set([
  "landing-hero",
  "landing-final",
  "landing",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254;

/**
 * @param {unknown} value
 * @returns {string|null}
 */
export function sanitizeWaitlistEmail(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim().toLowerCase().slice(0, MAX_EMAIL_LEN);
  return text || null;
}

/**
 * @param {string|null|undefined} email
 * @returns {boolean}
 */
export function isValidWaitlistEmail(email) {
  const value = sanitizeWaitlistEmail(email);
  if (!value) return false;
  return EMAIL_RE.test(value);
}

/**
 * @param {unknown} origem
 * @returns {string}
 */
export function normalizeWaitlistOrigem(origem) {
  const value = String(origem ?? "landing").trim().slice(0, 64);
  return WAITLIST_ORIGINS.has(value) ? value : "landing";
}

export const WAITLIST_MESSAGES = {
  SUCCESS:
    "Pronto! Você entrou na lista. Em breve enviamos um e-mail de confirmação.",
  ALREADY_REGISTERED:
    "Este e-mail já está na lista. Assim que tivermos novidades, você será avisado.",
  LGPD_REQUIRED: "Aceite receber novidades para continuar.",
  EMAIL_REQUIRED: "Informe seu e-mail para entrar na lista.",
  EMAIL_INVALID: "Informe um e-mail válido.",
  RATE_LIMIT: "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.",
  SERVER: "Não foi possível concluir seu cadastro agora. Tente novamente em instantes.",
  UNAVAILABLE:
    "Cadastro temporariamente indisponível. Tente novamente mais tarde ou escreva para contato@guiadebolso.app.",
};
