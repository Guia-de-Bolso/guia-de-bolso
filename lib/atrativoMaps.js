/**
 * Query string para apps de mapas (coordenadas ou endereço cadastrado).
 * @param {{ nome?: string, cidade?: string }} [rota]
 * @param {{ latitude?: number|null, longitude?: number|null, endereco_completo?: string|null }} [localizacao]
 * @returns {string}
 */
export function getAtrativoMapsQuery(rota, localizacao) {
  const latitude = Number(localizacao?.latitude);
  const longitude = Number(localizacao?.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `${latitude},${longitude}`;
  }

  if (localizacao?.endereco_completo?.trim()) {
    return localizacao.endereco_completo.trim();
  }

  const nome = rota?.nome || rota?.titulo || "Atrativo";
  const cidade = rota?.cidade || "Imbituba";
  return `${nome} ${cidade}`;
}

/**
 * Link do Google Maps para abrir a rota no ponto cadastrado.
 * @param {{ nome?: string, cidade?: string }} [rota]
 * @param {object} [localizacao]
 * @returns {string}
 */
export function getGoogleMapsUrlForAtrativo(rota, localizacao) {
  const query = encodeURIComponent(getAtrativoMapsQuery(rota, localizacao));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Link de navegação até o ponto cadastrado da rota.
 * @param {{ nome?: string, cidade?: string }} [rota]
 * @param {object} [localizacao]
 * @returns {string}
 */
export function getGoogleMapsDirectionsUrlForAtrativo(rota, localizacao) {
  const latitude = Number(localizacao?.latitude);
  const longitude = Number(localizacao?.longitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  const query = encodeURIComponent(getAtrativoMapsQuery(rota, localizacao));
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}
