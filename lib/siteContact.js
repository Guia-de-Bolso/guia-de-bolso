/** Domínio público e canais oficiais do Guia de Bolso. */

export const SITE_DOMAIN = "guiadebolso.app";

export const SITE_PUBLIC_URL = `https://${SITE_DOMAIN}`;

export const SITE_CONTACT_EMAIL = "contato@guiadebolso.app";

/** Telefone empresarial — exibição pública (WhatsApp / contato). */
export const SITE_CONTACT_PHONE_DISPLAY = "(48) 9 9122-3308";

/** E.164 para links tel: e wa.me (sem +). */
export const SITE_CONTACT_PHONE_E164 = "+5548991223308";

export const SITE_WHATSAPP_URL = "https://wa.me/5548991223308";

/**
 * @param {string} [phoneE164]
 * @returns {string}
 */
export function getSiteTelHref(phoneE164 = SITE_CONTACT_PHONE_E164) {
  return `tel:${phoneE164}`;
}

/** @type {{ instagram: string, tiktok: string }} */
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/guiadebolsoimbituba/",
  tiktok: "https://www.tiktok.com/@guiadebolsoimbituba",
};

/**
 * Hostname para exibição (PDF, rodapés).
 * @param {string} [siteUrl]
 * @returns {string}
 */
export function getSiteDisplayDomain(siteUrl = SITE_PUBLIC_URL) {
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, "");
  } catch {
    return SITE_DOMAIN;
  }
}
