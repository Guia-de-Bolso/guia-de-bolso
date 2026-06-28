import { getUsageDayKey } from "@/lib/premium";

const STORAGE_PREFIX = "guia:acessou_app:";

/**
 * Evita múltiplos `acessou_app` no mesmo dia (SP) por usuário — reduz writes em `logs`.
 * @param {string|null|undefined} userId
 * @returns {boolean} true se deve registrar o log agora
 */
export function shouldLogAcessouAppToday(userId) {
  if (!userId) return false;
  if (typeof window === "undefined") return true;

  const key = `${STORAGE_PREFIX}${userId}:${getUsageDayKey()}`;
  try {
    if (window.localStorage.getItem(key)) return false;
    window.localStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}
