/** Bucket público de avatares no Supabase Storage. */
export const AVATAR_STORAGE_BUCKET = "imagens";

/** Buckets aceitos para avatar (fallback para legado em produção). */
export const AVATAR_STORAGE_BUCKET_CANDIDATES = [
  "imagens",
  "Guia de Bolso - Imagens",
];

/**
 * @param {string} userId
 * @returns {string}
 */
export function getAvatarObjectPath(userId) {
  return `avatars/${userId}/avatar.jpg`;
}
