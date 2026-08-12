/**
 * Regras de exibição do perfil do lugar no app público.
 *
 * - Locais públicos (Natureza, trilhas etc.): perfil completo (curadoria editorial).
 * - Estabelecimento com `eh_parceiro`: perfil completo (Plano Parceiro).
 * - Estabelecimento ativo sem parceiro: perfil básico (teaser) — capa, descrição curta,
 *   IR AGORA; sem galeria, links, avaliações; CTA para o dono desbloquear.
 */

import { SITE_WHATSAPP_URL } from "./siteContact.js";

/**
 * @typedef {Object} VisibilidadePerfil
 * @property {"basico"|"completo"} perfil
 * @property {boolean} showGaleriaCompleta
 * @property {boolean} showDescricaoLonga
 * @property {boolean} showAcoesRapidasEstabelecimento
 * @property {boolean} showAcoesRapidasBloqueadas
 * @property {boolean} showTags
 * @property {boolean} showAvaliacoes
 * @property {boolean} showVideo
 * @property {boolean} showHistoriaCultura
 * @property {boolean} showClaimCta
 * @property {boolean} showBadgeParceiro
 * @property {boolean} showBadgeCuradoria
 */

/**
 * @param {boolean} ehParceiro - Plano Parceiro do Guia.
 * @param {boolean} [ehCuradoria] - Badge editorial (não desbloqueia perfil comercial).
 * @param {boolean} [ehEstabelecimento=true] - Negócio comercial (não praia/trilha).
 * @returns {VisibilidadePerfil}
 */
export function getVisibilidadePerfil(
  ehParceiro,
  ehCuradoria = false,
  ehEstabelecimento = true
) {
  const showBadgeParceiro = Boolean(ehParceiro);
  const showBadgeCuradoria = Boolean(ehCuradoria);
  const perfilCompleto = !ehEstabelecimento || Boolean(ehParceiro);

  if (perfilCompleto) {
    return {
      perfil: "completo",
      showGaleriaCompleta: true,
      showDescricaoLonga: true,
      showAcoesRapidasEstabelecimento: true,
      showAcoesRapidasBloqueadas: false,
      showTags: true,
      showAvaliacoes: true,
      showVideo: true,
      showHistoriaCultura: true,
      showClaimCta: false,
      showBadgeParceiro,
      showBadgeCuradoria,
    };
  }

  return {
    perfil: "basico",
    showGaleriaCompleta: false,
    showDescricaoLonga: false,
    showAcoesRapidasEstabelecimento: false,
    showAcoesRapidasBloqueadas: true,
    showTags: false,
    showAvaliacoes: false,
    showVideo: false,
    showHistoriaCultura: false,
    showClaimCta: true,
    showBadgeParceiro,
    showBadgeCuradoria,
  };
}

/**
 * @param {VisibilidadePerfil|null|undefined} visibilidade
 * @returns {boolean}
 */
export function isPerfilBasico(visibilidade) {
  return visibilidade?.perfil === "basico";
}

/**
 * WhatsApp da equipe com mensagem pré-preenchida para desbloquear o perfil.
 * @param {{ nome?: string, slug?: string, id?: string }|null|undefined} lugar
 * @returns {string}
 */
export function getClaimPerfilWhatsAppUrl(lugar) {
  const nome = lugar?.nome?.trim() || "meu estabelecimento";
  const ref = lugar?.slug?.trim() || lugar?.id || "";
  const text = `Olá! Sou proprietário ou gestor de "${nome}"${
    ref ? ` (${ref})` : ""
  } no Guia de Bolso e quero desbloquear o perfil completo.`;
  return `${SITE_WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}

/**
 * Fotos exibidas na página do lugar conforme o perfil.
 * @param {string[]} fotosCompletas
 * @param {string} capaUrl
 * @param {boolean} showGaleriaCompleta
 * @returns {string[]}
 */
export function getFotosParaExibicao(fotosCompletas, capaUrl, showGaleriaCompleta) {
  if (showGaleriaCompleta && fotosCompletas?.length > 0) {
    return fotosCompletas;
  }
  if (capaUrl) return [capaUrl];
  return fotosCompletas?.length ? [fotosCompletas[0]] : [];
}

/**
 * Texto da seção Sobre.
 * @param {object} lugar
 * @param {boolean} showDescricaoLonga
 * @returns {string|null}
 */
export function getTextoSobre(lugar, showDescricaoLonga) {
  if (!lugar) return null;
  if (showDescricaoLonga) {
    return lugar.descricao_longa || lugar.descricao || null;
  }
  return lugar.descricao || null;
}

/**
 * Texto da seção História e cultura (separado da descrição comercial).
 * @param {object} lugar
 * @returns {string|null}
 */
export function getTextoHistoriaCultura(lugar) {
  const texto = lugar?.historia_cultura?.trim();
  return texto || null;
}
