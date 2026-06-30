/**
 * Validação e metadados de vídeo no cliente.
 * Arquivos grandes são aceitos na seleção; a otimização ocorre em {@link compressVideoFile}.
 */

export const LUGAR_VIDEO_LIMITS = {
  /** Tamanho máximo do arquivo original selecionado. */
  maxInputBytes: 200 * 1024 * 1024,
  /** Tamanho máximo após otimização / upload. */
  maxOutputBytes: 25 * 1024 * 1024,
  maxDurationSeconds: 60,
  maxWidth: 1920,
  maxHeight: 1080,
  acceptedMimeTypes: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
  ],
  acceptedExtensions: ["mp4", "webm", "mov", "m4v"],
};

/**
 * @param {File} file
 * @returns {boolean}
 */
export function isAcceptedVideoFile(file) {
  if (!file) return false;
  if (LUGAR_VIDEO_LIMITS.acceptedMimeTypes.includes(file.type)) return true;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return LUGAR_VIDEO_LIMITS.acceptedExtensions.includes(ext);
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
 * Lê metadados básicos do vídeo via elemento `<video>`.
 * @param {File} file
 * @returns {Promise<{ durationSeconds: number, width: number, height: number }>}
 */
export function getVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const durationSeconds = Number(video.duration);
      const width = Number(video.videoWidth) || 0;
      const height = Number(video.videoHeight) || 0;

      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        reject(new Error("Não foi possível ler a duração do vídeo."));
        return;
      }

      resolve({ durationSeconds, width, height });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler o vídeo. Use MP4, MOV ou WebM."));
    };

    video.src = url;
  });
}

/**
 * Valida arquivo selecionado pelo admin (entrada — pode ser grande).
 * @param {File} file
 * @returns {Promise<{ durationSeconds: number, width: number, height: number }>}
 */
export async function validateVideoInputFile(file) {
  if (!isAcceptedVideoFile(file)) {
    throw new Error("Formato inválido. Envie MP4, MOV ou WebM.");
  }

  if (file.size > LUGAR_VIDEO_LIMITS.maxInputBytes) {
    throw new Error(
      `Vídeo muito grande (${formatVideoFileSize(file.size)}). Máximo ${formatVideoFileSize(LUGAR_VIDEO_LIMITS.maxInputBytes)} na seleção.`
    );
  }

  const metadata = await getVideoMetadata(file);

  if (metadata.durationSeconds > LUGAR_VIDEO_LIMITS.maxDurationSeconds) {
    throw new Error(
      `Vídeo muito longo (${formatVideoDuration(metadata.durationSeconds)}). Máximo ${LUGAR_VIDEO_LIMITS.maxDurationSeconds} segundos.`
    );
  }

  return metadata;
}

/**
 * Valida arquivo final antes do upload ao Storage (com ou sem otimização).
 * @param {File} file
 * @returns {Promise<{ durationSeconds: number, width: number, height: number }>}
 */
export async function validateVideoForStorage(file) {
  if (!isAcceptedVideoFile(file)) {
    throw new Error("Formato inválido. Envie MP4, MOV ou WebM.");
  }

  if (file.size > LUGAR_VIDEO_LIMITS.maxInputBytes) {
    throw new Error(
      `Vídeo muito grande (${formatVideoFileSize(file.size)}). Máximo ${formatVideoFileSize(LUGAR_VIDEO_LIMITS.maxInputBytes)}.`
    );
  }

  const metadata = await getVideoMetadata(file);

  if (metadata.durationSeconds > LUGAR_VIDEO_LIMITS.maxDurationSeconds) {
    throw new Error(
      `Vídeo muito longo (${formatVideoDuration(metadata.durationSeconds)}). Máximo ${LUGAR_VIDEO_LIMITS.maxDurationSeconds} segundos.`
    );
  }

  return metadata;
}

/**
 * Valida arquivo após otimização (alias — aceita até o limite de entrada).
 * @param {File} file
 * @returns {Promise<{ durationSeconds: number, width: number, height: number }>}
 */
export async function validateVideoOutputFile(file) {
  return validateVideoForStorage(file);
}

/** @deprecated Use validateVideoInputFile ou validateVideoOutputFile. */
export async function validateVideoFile(file) {
  return validateVideoOutputFile(file);
}
