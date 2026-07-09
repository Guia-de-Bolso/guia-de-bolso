import { compressEntityPhotoWithThumb } from "@/lib/imageCompress";
import { compressVideoFile } from "@/lib/videoCompress";
import { getVideoMetadata, validateVideoForStorage } from "@/lib/videoUpload";

export const LUGARES_FOTOS_BUCKET = "lugares-fotos";

/** Bucket Supabase para fotos de rotas. */
export const ROTAS_FOTOS_BUCKET = "rotas-fotos";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Verifica se o arquivo é imagem aceita (JPEG, PNG ou WebP).
 * @param {File} file
 * @returns {boolean}
 */
export function isAcceptedImageFile(file) {
  return ACCEPTED_TYPES.includes(file.type);
}

/**
 * Mensagem amigável para erros comuns do Supabase Storage.
 * @param {unknown} error
 * @returns {string}
 */
export function getStorageErrorMessage(error) {
  const msg = String(error?.message || error || "");

  if (msg.includes("Bucket not found")) {
    return 'Bucket "lugares-fotos" não encontrado. Crie-o no Supabase Storage (público) e aplique supabase/fotos_migration.sql.';
  }
  if (/row-level security|RLS|policy/i.test(msg)) {
    return "Sem permissão para enviar fotos. Faça login como admin e confira as policies de Storage (fotos_migration.sql).";
  }
  if (/not authenticated|JWT|session/i.test(msg)) {
    return "Sessão expirada. Faça login novamente e tente enviar as fotos.";
  }
  if (/payload too large|entity too large/i.test(msg)) {
    return "Arquivo muito grande. Reduza o tamanho antes de enviar.";
  }

  return msg || "Não foi possível enviar o arquivo.";
}

/**
 * Sanitiza nome de arquivo para uso seguro no Storage.
 * @param {string} [name]
 * @returns {string}
 */
export function sanitizeStorageFileName(name) {
  const base = String(name || "foto")
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return base || "foto";
}

/**
 * Infere extensão do arquivo a partir do nome ou MIME type.
 * @param {File} file
 * @returns {'jpg'|'png'|'webp'}
 */
export function getFileExtension(file) {
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

/**
 * @typedef {{ url: string, thumb: string, blur?: string|null }} EntityPhotoUpload
 */

/**
 * Envia um arquivo para o bucket e retorna a URL pública.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket
 * @param {string} path
 * @param {File} file
 * @returns {Promise<string>}
 */
async function uploadFileToBucket(supabase, bucket, path, file) {
  const ext = getFileExtension(file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Faz upload de uma foto (full + thumbnail) para o bucket.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket - Nome do bucket (ex.: {@link LUGARES_FOTOS_BUCKET}).
 * @param {string} entityId - ID do lugar ou rota (prefixo do path).
 * @param {File} file
 * @returns {Promise<EntityPhotoUpload>}
 */
export async function uploadEntityPhoto(supabase, bucket, entityId, file) {
  let fullFile = file;
  let thumbFile = file;
  let blur = null;

  try {
    ({ full: fullFile, thumb: thumbFile, blur } = await compressEntityPhotoWithThumb(file));
  } catch (error) {
    console.warn("[uploadEntityPhoto] compressão:", error?.message);
    throw new Error(
      error?.message || "Não foi possível preparar a imagem para envio."
    );
  }

  const ext = getFileExtension(fullFile);
  const safeName = sanitizeStorageFileName(fullFile.name);
  const timestamp = Date.now();
  const fullPath = `${entityId}/${timestamp}-${safeName}.${ext}`;
  const thumbPath = `${entityId}/${timestamp}-${safeName}-thumb.${ext}`;

  const [url, thumb] = await Promise.all([
    uploadFileToBucket(supabase, bucket, fullPath, fullFile),
    uploadFileToBucket(supabase, bucket, thumbPath, thumbFile),
  ]);

  return { url, thumb, ...(blur ? { blur } : {}) };
}

/**
 * Faz upload sequencial de várias fotos.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket
 * @param {string} entityId
 * @param {File[]} files
 * @returns {Promise<EntityPhotoUpload[]>}
 */
export async function uploadEntityPhotos(supabase, bucket, entityId, files) {
  const uploads = [];
  for (const file of files) {
    uploads.push(await uploadEntityPhoto(supabase, bucket, entityId, file));
  }
  return uploads;
}

/**
 * Infere extensão de vídeo (mp4 ou webm).
 * @param {File} file
 * @returns {'mp4'|'webm'}
 */
export function getVideoFileExtension(file) {
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  if (fromName === "webm") return "webm";
  if (fromName === "mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  return "mp4";
}

/**
 * Upload de vídeo para subpasta `videos/` no bucket do lugar.
 * Otimiza no cliente antes do envio (FFmpeg.wasm).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket
 * @param {string|number} entityId
 * @param {File} file
 * @param {{ onProgress?: (pct: number) => void }} [options]
 * @returns {Promise<string>}
 */
export async function uploadEntityVideo(supabase, bucket, entityId, file, options = {}) {
  const { onProgress } = options;

  let metadata;
  try {
    metadata = await getVideoMetadata(file);
  } catch (error) {
    throw new Error(error?.message || "Não foi possível ler o vídeo.");
  }

  let uploadFile = file;

  try {
    uploadFile = await compressVideoFile(file, { metadata, onProgress });
    await validateVideoForStorage(uploadFile);
  } catch (error) {
    console.warn("[uploadEntityVideo] otimização:", error?.message);
    throw new Error(error?.message || "Não foi possível preparar o vídeo para envio.");
  }

  const ext = getVideoFileExtension(uploadFile);
  const safeName = sanitizeStorageFileName(uploadFile.name);
  const path = `${entityId}/videos/${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, uploadFile, {
    cacheControl: "3600",
    upsert: false,
    contentType: uploadFile.type || `video/${ext}`,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
