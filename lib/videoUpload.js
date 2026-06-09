/**
 * Validação de vídeo no cliente (sem transcodificação — admin deve enviar arquivo já comprimido).
 *
 * Limites:
 * - Duração: até 60 segundos
 * - Tamanho: até 25 MB
 * - Formatos: MP4 (H.264) ou WebM
 */

export const LUGAR_VIDEO_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
  maxDurationSeconds: 60,
  acceptedMimeTypes: ["video/mp4", "video/webm"],
};

const ACCEPTED_EXTENSIONS = ["mp4", "webm"];

/**
 * @param {File} file
 * @returns {boolean}
 */
export function isAcceptedVideoFile(file) {
  if (!file) return false;
  if (LUGAR_VIDEO_LIMITS.acceptedMimeTypes.includes(file.type)) return true;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatVideoFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {number} seconds
 * @returns {string}
 */
export function formatVideoDuration(seconds) {
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`;
}

/**
 * Lê duração do vídeo via elemento `<video>` (metadata only).
 * @param {File} file
 * @returns {Promise<number>}
 */
function getVideoDurationSeconds(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = Number(video.duration);
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error("Não foi possível ler a duração do vídeo."));
        return;
      }
      resolve(duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler o vídeo. Use MP4 ou WebM."));
    };

    video.src = url;
  });
}

/**
 * Valida tipo, tamanho e duração antes do upload.
 * @param {File} file
 * @returns {Promise<{ durationSeconds: number }>}
 */
export async function validateVideoFile(file) {
  if (!isAcceptedVideoFile(file)) {
    throw new Error("Formato inválido. Envie MP4 ou WebM.");
  }

  if (file.size > LUGAR_VIDEO_LIMITS.maxBytes) {
    throw new Error(
      `Vídeo muito grande (${formatVideoFileSize(file.size)}). Máximo ${formatVideoFileSize(LUGAR_VIDEO_LIMITS.maxBytes)}. Comprima antes de enviar.`
    );
  }

  const durationSeconds = await getVideoDurationSeconds(file);

  if (durationSeconds > LUGAR_VIDEO_LIMITS.maxDurationSeconds) {
    throw new Error(
      `Vídeo muito longo (${formatVideoDuration(durationSeconds)}). Máximo ${LUGAR_VIDEO_LIMITS.maxDurationSeconds} segundos.`
    );
  }

  return { durationSeconds };
}
