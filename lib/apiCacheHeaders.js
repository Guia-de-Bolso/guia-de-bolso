/** Cache CDN para respostas públicas de catálogo (segundos). */
export const LUGARES_API_S_MAXAGE = 300;
export const LUGARES_API_STALE = 600;

/**
 * Headers Cache-Control para GET /api/lugares.
 * @returns {HeadersInit}
 */
export function lugaresApiCacheHeaders() {
  return {
    "Cache-Control": `public, s-maxage=${LUGARES_API_S_MAXAGE}, stale-while-revalidate=${LUGARES_API_STALE}`,
  };
}

/**
 * Contagens do Explorar — sem cache CDN.
 * A listagem por categoria consulta o catálogo ao vivo; 5 min deixava o número do card atrás.
 * @returns {HeadersInit}
 */
export function explorarApiCacheHeaders() {
  return {
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
  };
}
