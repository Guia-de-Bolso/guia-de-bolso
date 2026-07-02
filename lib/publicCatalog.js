/**
 * Catálogo público do app — produção (App Store).
 * Exibe todo estabelecimento/atrativo com `status = 'ativo'`, incluindo conteúdo
 * de curadoria (praias, lagoas, trilhas) e cadastros do plano gratuito.
 * O status é o único gate de visibilidade — cadastros de teste ficam em
 * `em_analise`/`desativado`.
 */

/**
 * Quando true, o app público lista SÓ parceiros ativos (`eh_parceiro`).
 * Mantido como flag para reativação futura; desligado para exibir também
 * atrativos naturais e o plano gratuito nas categorias e no explorar.
 */
export const PUBLIC_APP_PARTNERS_ONLY = false;

/**
 * Aplica filtros de visibilidade pública em uma query Supabase de `lugares`.
 * @param {import('@supabase/postgrest-js').PostgrestFilterBuilder<any, any, any>} query
 * @returns {import('@supabase/postgrest-js').PostgrestFilterBuilder<any, any, any>}
 */
export function applyPublicLugarFilters(query) {
  let next = query.eq("status", "ativo");
  if (PUBLIC_APP_PARTNERS_ONLY) {
    next = next.eq("eh_parceiro", true);
  }
  return next;
}

/**
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
export function isLugarVisivelNoApp(lugar) {
  if (!lugar) return false;
  if (lugar.status && lugar.status !== "ativo") return false;
  if (PUBLIC_APP_PARTNERS_ONLY && !lugar.eh_parceiro) return false;
  return true;
}

/**
 * @param {Array<object>|null|undefined} lugares
 * @returns {Array<object>}
 */
export function filterLugaresPublicos(lugares) {
  return (lugares ?? []).filter(isLugarVisivelNoApp);
}
