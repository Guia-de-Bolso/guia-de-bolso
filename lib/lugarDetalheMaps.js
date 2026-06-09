/**
 * Deep links e helpers de mapas para a página de detalhe do lugar.
 */

/**
 * @param {object} lugar
 * @param {object} [localizacao]
 * @returns {string}
 */
export function getRouteQuery(lugar, localizacao) {
  const latitude = Number(localizacao?.latitude);
  const longitude = Number(localizacao?.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `${latitude},${longitude}`;
  }

  return (
    localizacao?.endereco_completo ||
    lugar.endereco ||
    `${lugar.nome} Imbituba Santa Catarina`
  );
}

/**
 * @param {object} lugar
 * @param {object} [localizacao]
 * @returns {string}
 */
export function googleMapsUrl(lugar, localizacao) {
  const query = encodeURIComponent(getRouteQuery(lugar, localizacao));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * @param {object} lugar
 * @param {object} [localizacao]
 * @returns {string}
 */
export function appleMapsUrl(lugar, localizacao) {
  return `https://maps.apple.com/?q=${encodeURIComponent(getRouteQuery(lugar, localizacao))}`;
}

/**
 * @param {object} lugar
 * @param {object} [localizacao]
 * @returns {string}
 */
export function wazeUrl(lugar, localizacao) {
  const latitude = Number(localizacao?.latitude);
  const longitude = Number(localizacao?.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
  }

  return `https://waze.com/ul?q=${encodeURIComponent(getRouteQuery(lugar, localizacao))}&navigate=yes`;
}

/**
 * @param {string} [value]
 * @returns {string|null}
 */
export function instagramUrl(value) {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  const handle = value.replace("@", "");
  return `https://instagram.com/${handle}`;
}

/**
 * @param {string} [value]
 * @returns {string|null}
 */
export function facebookUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http")) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return `https://facebook.com/${handle}`;
}

export const CATEGORIA_STYLES = {
  Natureza: "bg-[#b8e6d4] text-[#1a4a3a]",
  Gastronomia: "bg-[#f0e4d4] text-[#6b5344]",
  Noite: "bg-[#e4d4f0] text-[#5c4a6e]",
  Serviços: "bg-[#c5dff5] text-[#2a5a7a]",
  Hospedagem: "bg-[#f5e6b8] text-[#7a6520]",
};
