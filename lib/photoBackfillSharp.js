import sharp from "sharp";
import { BLUR_PLACEHOLDER_SIZE } from "./imageBlur.js";

export const THUMB_MAX_SIZE = 480;
export const THUMB_WEBP_QUALITY = 78;

/**
 * Gera thumb WebP + blur JPEG (base64) a partir de um buffer de imagem.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ thumbBuffer: Buffer, blur: string }>}
 */
export async function createPhotoDerivativesFromBuffer(imageBuffer) {
  const thumbBuffer = await sharp(imageBuffer)
    .rotate()
    .resize(THUMB_MAX_SIZE, THUMB_MAX_SIZE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: THUMB_WEBP_QUALITY })
    .toBuffer();

  const blurBuffer = await sharp(imageBuffer)
    .rotate()
    .resize(BLUR_PLACEHOLDER_SIZE, BLUR_PLACEHOLDER_SIZE, { fit: "cover" })
    .jpeg({ quality: 65 })
    .toBuffer();

  const blur = `data:image/jpeg;base64,${blurBuffer.toString("base64")}`;

  return { thumbBuffer, blur };
}
