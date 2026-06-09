const CATEGORIAS_VIDEO_PADRAO = ["Natureza", "Aventura"];

/**
 * Admin pode enviar vídeo se a categoria é elegível ou `tem_video` está ativo.
 * @param {{ categoria?: string, tem_video?: boolean }} lugar
 * @returns {boolean}
 */
export function isLugarElegivelVideo(lugar) {
  const categoria = String(lugar?.categoria || "").trim();
  if (CATEGORIAS_VIDEO_PADRAO.includes(categoria)) return true;
  return Boolean(lugar?.tem_video);
}

/**
 * Detalhe do lugar exibe a seção só quando há URL salva.
 * @param {{ video_url?: string|null }} lugar
 * @returns {boolean}
 */
export function lugarExibeVideo(lugar) {
  return Boolean(String(lugar?.video_url || "").trim());
}
