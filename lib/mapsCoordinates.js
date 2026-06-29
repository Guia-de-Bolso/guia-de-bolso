import { getAtrativoMapsQuery } from "./atrativoMaps.js";
import { getRouteQuery } from "./lugarDetalheMaps.js";

/**
 * @param {object|null|undefined} localizacao
 * @returns {{ latitude: number, longitude: number }|null}
 */
export function parseMapCoordinates(localizacao) {
  const latitude = Number(localizacao?.latitude);
  const longitude = Number(localizacao?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

/**
 * @param {{ latitude: number, longitude: number }|null} coords
 * @returns {string|null}
 */
export function formatCoordinatesLabel(coords) {
  if (!coords) return null;
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

/**
 * @param {object} [lugar]
 * @param {object} [localizacao]
 * @returns {{ google: string, apple: string, waze: string }|null}
 */
export function buildMapsUrlsForLugar(lugar, localizacao) {
  if (!lugar) return null;

  const coords = parseMapCoordinates(localizacao);
  if (coords) {
    const { latitude, longitude } = coords;
    return {
      google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      apple: `https://maps.apple.com/?daddr=${latitude},${longitude}`,
      waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
    };
  }

  const query = encodeURIComponent(getRouteQuery(lugar, localizacao));
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    apple: `https://maps.apple.com/?q=${query}`,
    waze: `https://waze.com/ul?q=${query}&navigate=yes`,
  };
}

/**
 * @param {object} [rota]
 * @param {object} [localizacao]
 * @returns {{ google: string, apple: string, waze: string }|null}
 */
export function buildMapsUrlsForAtrativo(rota, localizacao) {
  const coords = parseMapCoordinates(localizacao);
  if (coords) {
    const { latitude, longitude } = coords;
    return {
      google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      apple: `https://maps.apple.com/?daddr=${latitude},${longitude}`,
      waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
    };
  }

  const rawQuery = getAtrativoMapsQuery(rota, localizacao);
  const query = encodeURIComponent(rawQuery);
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    apple: `https://maps.apple.com/?q=${query}`,
    waze: `https://waze.com/ul?q=${query}&navigate=yes`,
  };
}

/**
 * @param {object} [localizacao]
 * @returns {string|null}
 */
export function getMapAddressLabel(localizacao) {
  const address = localizacao?.endereco_completo?.trim();
  return address || null;
}
