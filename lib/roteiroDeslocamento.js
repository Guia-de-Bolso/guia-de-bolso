/**
 * Distância em linha reta entre paradas do roteiro, quando há coordenadas.
 * @module lib/roteiroDeslocamento
 */

import { calcularDistanciaKm } from "./localizacao.js";

/**
 * @param {{ latitude: number, longitude: number }|null|undefined} origem
 * @param {{ latitude: number, longitude: number }|null|undefined} destino
 * @returns {string|null}
 */
export function descreverDeslocamento(origem, destino) {
  const km = calcularDistanciaKm(origem, destino);
  if (!Number.isFinite(km) || km < 0.08) return null;

  const distancia =
    km < 1
      ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`
      : `${km.toFixed(1).replace(".", ",")} km`;

  return `${distancia} em linha reta até a próxima`;
}
