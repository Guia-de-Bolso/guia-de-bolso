import { ADMIN_ACCESS_ROLES } from "./adminRoles.js";

/**
 * Papéis da equipe. O uso dessas contas (usuários, sessões e eventos)
 * fica fora dos relatórios. As linhas originais permanecem no banco.
 */
export const REPORT_EXCLUDED_ROLES = ADMIN_ACCESS_ROLES;

/** Nota curta exibida nas telas que usam estas métricas. */
export const REPORT_AUDIENCE_NOTE =
  "Contas admin e dev não entram nestes números. Sessões e eventos delas continuam salvos.";

/**
 * @param {string} [role]
 * @returns {boolean}
 */
export function isExcludedReportRole(role) {
  return REPORT_EXCLUDED_ROLES.includes(role);
}

/**
 * Mantém visitantes sem login e descarta eventos das contas excluídas.
 * @param {Array<{ user_id?: string|null }>|null|undefined} rows
 * @param {Set<string>} excludedUserIds
 * @returns {Array<{ user_id?: string|null }>}
 */
export function filterReportRows(rows, excludedUserIds) {
  const list = rows ?? [];
  if (!excludedUserIds || excludedUserIds.size === 0) return list;

  return list.filter((row) => {
    const userId = row?.user_id ?? null;
    if (!userId) return true;
    return !excludedUserIds.has(userId);
  });
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<Set<string>>}
 */
export async function fetchExcludedReportUserIds(supabase) {
  const { data, error } = await supabase
    .from("perfis")
    .select("id")
    .in("role", REPORT_EXCLUDED_ROLES);

  if (error) {
    console.error("[reportAudience] perfis:", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.id).filter(Boolean));
}

/**
 * Reutiliza o conjunto já carregado ou busca uma vez.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {Set<string>|undefined} excludedUserIds
 * @returns {Promise<Set<string>>}
 */
export async function resolveExcludedReportUserIds(supabase, excludedUserIds) {
  if (excludedUserIds instanceof Set) return excludedUserIds;
  return fetchExcludedReportUserIds(supabase);
}
