import { generateBlurDataUrlFromImage } from "@/lib/imageBlur";

/**
 * Redimensiona mantendo proporção dentro dos limites.
 * @param {number} width
 * @param {number} height
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @returns {{ width: number, height: number }}
 */
function scaleDimensions(width, height, maxWidth, maxHeight) {
  let w = width;
  let h = height;

  if (w <= maxWidth && h <= maxHeight) {
    return { width: w, height: h };
  }

  const ratio = Math.min(maxWidth / w, maxHeight / h);
  return {
    width: Math.max(1, Math.round(w * ratio)),
    height: Math.max(1, Math.round(h * ratio)),
  };
}

/**
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };

    img.src = url;
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} mime
 * @param {number} quality
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Não foi possível comprimir a imagem."));
      },
      mime,
      quality
    );
  });
}

/**
 * Comprime a partir de um HTMLImageElement já carregado.
 * @param {HTMLImageElement} img
 * @param {string} baseName
 * @param {object} [options]
 * @returns {Promise<File>}
 */
async function compressImageElement(img, baseName, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    minQuality = 0.5,
    targetSizeKB = 150,
    outputMime = "image/jpeg",
    force = false,
  } = options;

  const needsResize =
    img.naturalWidth > maxWidth || img.naturalHeight > maxHeight;

  if (!force && !needsResize) {
    throw new Error("compressImageElement requer resize ou force=true.");
  }

  const { width, height } = scaleDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxWidth,
    maxHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Seu navegador não suporta compressão de imagem.");
  }

  ctx.drawImage(img, 0, 0, width, height);

  const targetBytes = targetSizeKB * 1024;
  let currentQuality = quality;
  let blob = await canvasToBlob(canvas, outputMime, currentQuality);

  while (blob.size > targetBytes && currentQuality > minQuality) {
    currentQuality = Math.max(minQuality, currentQuality - 0.08);
    blob = await canvasToBlob(canvas, outputMime, currentQuality);
  }

  const ext = outputMime === "image/webp" ? "webp" : "jpg";
  const safeName = (baseName || "foto").replace(/\.[^.]+$/, "") || "foto";

  return new File([blob], `${safeName}.${ext}`, {
    type: outputMime,
    lastModified: Date.now(),
  });
}

/**
 * Comprime imagem no client via canvas (JPEG/WebP).
 * Redimensiona quando necessário e itera a qualidade até atingir `targetSizeKB`.
 * @param {File} file
 * @param {object} [options]
 * @param {number} [options.maxWidth=1920]
 * @param {number} [options.maxHeight=1920]
 * @param {number} [options.quality=0.82]
 * @param {number} [options.minQuality=0.5]
 * @param {number} [options.maxSizeKB=200] - Pula compressão se já estiver abaixo (sem resize).
 * @param {number} [options.targetSizeKB=150] - Alvo após resize/compressão.
 * @param {string} [options.outputMime="image/jpeg"]
 * @param {boolean} [options.force=false] - Sempre comprime, mesmo sem resize.
 * @returns {Promise<File>}
 */
export async function compressImageFile(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    maxSizeKB = 200,
    force = false,
  } = options;

  if (!file?.type?.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido.");
  }

  const img = await loadImageFromFile(file);
  const needsResize =
    img.naturalWidth > maxWidth || img.naturalHeight > maxHeight;
  const alreadySmall = file.size <= maxSizeKB * 1024;

  if (!force && !needsResize && alreadySmall) {
    return file;
  }

  return compressImageElement(img, file.name, {
    ...options,
    force: true,
  });
}

/**
 * Gera versão full + thumbnail + blur LQIP a partir de um único decode.
 * @param {File} file
 * @returns {Promise<{ full: File, thumb: File, blur: string|null }>}
 */
export async function compressEntityPhotoWithThumb(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido.");
  }

  const img = await loadImageFromFile(file);
  const blur = generateBlurDataUrlFromImage(img);
  const [full, thumb] = await Promise.all([
    compressImageElement(img, file.name, {
      ...ENTITY_PHOTO_COMPRESS_OPTIONS,
      force: true,
    }),
    compressImageElement(img, file.name, {
      ...ENTITY_THUMB_COMPRESS_OPTIONS,
      force: true,
    }),
  ]);

  return { full, thumb, blur };
}

/** Presets usados no app. */
export const AVATAR_COMPRESS_OPTIONS = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  maxSizeKB: 200,
  targetSizeKB: 120,
  outputMime: "image/jpeg",
};

export const ENTITY_PHOTO_COMPRESS_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
  maxSizeKB: 200,
  targetSizeKB: 150,
  outputMime: "image/webp",
};

export const ENTITY_THUMB_COMPRESS_OPTIONS = {
  maxWidth: 480,
  maxHeight: 480,
  quality: 0.78,
  minQuality: 0.55,
  targetSizeKB: 40,
  outputMime: "image/webp",
};
