/** Chaves estáveis para cache client-side (SWR). */
export const CLIENT_CACHE_KEYS = {
  homePrimary: "home-primary-feed",
  explorar: "explorar-category-counts",
  atrativosPage: "atrativos-page",
  /** @param {string} userId */
  perfilPage: (userId) => `perfil-page:${userId}`,
  /** @param {string} userId @param {string} lugarId */
  favoritoLugar: (userId, lugarId) => `favorito-lugar:${userId}:${lugarId}`,
  /** @param {string} userId @param {string} rotaId */
  favoritoAtrativo: (userId, rotaId) => `favorito-atrativo:${userId}:${rotaId}`,
};
