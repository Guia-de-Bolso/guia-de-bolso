/** Bucket público de avatares no Supabase Storage. */
export const AVATAR_STORAGE_BUCKET = "imagens";

/**
 * @param {string} userId
 * @returns {string}
 */
export function getAvatarObjectPath(userId) {
  return `avatars/${userId}/avatar.jpg`;
}
