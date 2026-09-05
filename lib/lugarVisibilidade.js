/**
 * Regras de exibição do perfil do lugar no app público.
 *
 * - Locais públicos (Natureza, trilhas etc.): perfil completo (curadoria editorial).
 * - Estabelecimento com `eh_parceiro`: perfil completo (Plano Parceiro pago).
 * - Estabelecimento com promo ativa (`perfil_promo_ate`): perfil completo temporário.
 * - Presença (Farmácias, Mercados, Mecânicos, Saúde, Igrejas e templos, Museus,
 *   Monumentos): perfil completo permanente — não cobramos desses locais; o turista
 *   vê galeria, links, avaliações e história.
 * - Outros estabelecimentos sem parceiro/promo: perfil básico (teaser) — capa, descrição
 *   curta, IR AGORA, WhatsApp/telefone; Instagram, cardápio, site e avaliações no plano pago.
 */

import { SITE_WHATSAPP_URL } from "./siteContact.js";

/**
 * @typedef {Object} VisibilidadePerfil
 * @property {"basico"|"completo"} perfil
 * @property {boolean} showGaleriaCompleta
 * @property {boolean} showDescricaoLonga
 * @property {boolean} showAcoesRapidasEstabelecimento
 * @property {boolean} showContatoBasico
 * @property {boolean} showAcoesRapidasBloqueadas
 * @property {boolean} showTags
 * @property {boolean} showAvaliacoes
 * @property {boolean} showVideo
 * @property {boolean} showHistoriaCultura
 * @property {boolean} showClaimCta
 * @property {boolean} showBadgeParceiro
 * @property {boolean} showBadgeCuradoria
 * @property {boolean} showBadgeLancamento
 */

/**
 * @param {boolean} ehParceiro - Plano Parceiro do Guia.
 * @param {boolean} [ehCuradoria] - Badge editorial (não desbloqueia perfil comercial).
 * @param {boolean} [ehEstabelecimento=true] - Negócio comercial (não praia/trilha).
 * @param {boolean} [perfilPromoAtivo=false] - Promo de perfil completo até `perfil_promo_ate`.
 * @param {boolean} [ehUtilitario=false] - Subcategoria Presença (utilitário, sem cobrança).
 * @returns {VisibilidadePerfil}
 */
export function getVisibilidadePerfil(
  ehParceiro,
  ehCuradoria = false,
  ehEstabelecimento = true,
  perfilPromoAtivo = false,
  ehUtilitario = false
) {
  const showBadgeParceiro = Boolean(ehParceiro);
  const showBadgeCuradoria = Boolean(ehCuradoria);
  const showBadgeLancamento = Boolean(perfilPromoAtivo && ehEstabelecimento && !ehParceiro);
  const perfilCompleto =
    !ehEstabelecimento ||
    Boolean(ehParceiro) ||
    Boolean(perfilPromoAtivo) ||
    Boolean(ehUtilitario);

  if (perfilCompleto) {
    return {
      perfil: "completo",
      showGaleriaCompleta: true,
      showDescricaoLonga: true,
      showAcoesRapidasEstabelecimento: true,
      showContatoBasico: false,
      showAcoesRapidasBloqueadas: false,
      showTags: true,
      showAvaliacoes: true,
      showVideo: true,
      showHistoriaCultura: true,
      showClaimCta: false,
      showBadgeParceiro,
      showBadgeCuradoria,
      showBadgeLancamento,
    };
  }

  return {
    perfil: "basico",
    showGaleriaCompleta: false,
    showDescricaoLonga: false,
    showAcoesRapidasEstabelecimento: false,
    showContatoBasico: true,
    showAcoesRapidasBloqueadas: false,
    showTags: false,
    showAvaliacoes: false,
    showVideo: false,
    showHistoriaCultura: false,
    showClaimCta: true,
    showBadgeParceiro,
    showBadgeCuradoria,
    showBadgeLancamento: false,
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
