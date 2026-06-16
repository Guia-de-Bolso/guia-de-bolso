/** Bucket legado em produção (único bucket de imagens gerais existente). */
export const AVATAR_STORAGE_BUCKET = "Guia de Bolso - Imagens";

/** Buckets aceitos para avatar — legado primeiro, `imagens` só se existir no futuro. */
export const AVATAR_STORAGE_BUCKET_CANDIDATES = [
  "Guia de Bolso - Imagens",
  "imagens",
];

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * @param {string} userId
 * @returns {string}
 */
export function getAvatarObjectPath(userId) {
  return `avatars/${userId}/avatar.jpg`;
}

/**
 * @param {string} contentType
 * @returns {boolean}
 */
export function isAllowedAvatarMime(contentType) {
  return AVATAR_ALLOWED_TYPES.has(String(contentType || "").toLowerCase());
}

/**
 * @param {number} byteLength
 * @returns {boolean}
 */
export function isAllowedAvatarSize(byteLength) {
  return Number.isFinite(byteLength) && byteLength > 0 && byteLength <= AVATAR_MAX_BYTES;
}

/**
 * Faz upload do avatar no Storage (server-side com service role).
 * @param {import('@supabase/supabase-js').SupabaseClient} storageClient
 * @param {string} userId
 * @param {ArrayBuffer|Buffer|Blob} body
 * @param {string} contentType
 * @returns {Promise<{ foto_url: string, bucket: string }|{ error: import('@supabase/supabase-js').StorageError }>}
 */
export async function uploadAvatarForUser(storageClient, userId, body, contentType) {
  const filePath = getAvatarObjectPath(userId);
  let lastError = null;

  for (const bucket of AVATAR_STORAGE_BUCKET_CANDIDATES) {
    const { error } = await storageClient.storage.from(bucket).upload(filePath, body, {
      cacheControl: "3600",
      upsert: true,
      contentType: contentType || "image/jpeg",
    });

    if (!error) {
      const { data } = storageClient.storage.from(bucket).getPublicUrl(filePath);
      return { foto_url: data.publicUrl, bucket };
    }

    lastError = error;
  }

  return { error: lastError };
}
