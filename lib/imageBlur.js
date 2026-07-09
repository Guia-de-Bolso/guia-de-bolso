/** Tamanho do placeholder LQIP gerado no upload (estilo Next/Image). */
export const BLUR_PLACEHOLDER_SIZE = 10;

/**
 * Gera data URL JPEG minúsculo para blur-up por foto.
 * @param {HTMLImageElement} img
 * @param {number} [size=BLUR_PLACEHOLDER_SIZE]
 * @returns {string|null}
 */
export function generateBlurDataUrlFromImage(img, size = BLUR_PLACEHOLDER_SIZE) {
  if (!img?.naturalWidth || !img?.naturalHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.65);
}
