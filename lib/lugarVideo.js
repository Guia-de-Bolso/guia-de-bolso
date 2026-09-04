import { isConteudoCuradoria, isParceiro } from "./lugarBadges.js";
import { isLugarEstabelecimento } from "./lugarDetalhe.js";
import { isPerfilPromoAtivo, isSubcategoriaPresenca } from "./planoLancamento.js";
import { getVisibilidadePerfil } from "./lugarVisibilidade.js";

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
 * Detalhe do lugar exibe o vídeo no primeiro slide do hero quando há URL.
 * @param {{ video_url?: string|null }} lugar
 * @returns {boolean}
 */
export function lugarExibeVideo(lugar) {
  return Boolean(String(lugar?.video_url || "").trim());
}

/**
 * Vídeo visível no app público (hero e badge nos cards).
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
export function lugarMostraVideoPublico(lugar) {
  if (!lugarExibeVideo(lugar)) return false;
  const visibilidade = getVisibilidadePerfil(
    isParceiro(lugar),
    isConteudoCuradoria(lugar),
    isLugarEstabelecimento(lugar),
    isPerfilPromoAtivo(lugar.perfil_promo_ate),
    isSubcategoriaPresenca(lugar.subcategoria)
  );
  return visibilidade.showVideo;
}
