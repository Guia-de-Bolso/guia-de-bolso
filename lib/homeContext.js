import { FILTRO_STATUS_BUSCA } from "@/lib/busca";
import {
  calcularDistanciaKm,
  getCoordenadasLugar,
  IMBITUBA_COORDS,
} from "@/lib/localizacao";

/** Chips de busca rápida na home (query + filtro opcional). */
export const QUICK_SEARCH_CHIPS = [
  {
    id: "calmo",
    label: "Lugares calmos",
    emoji: "🍃",
    query: "Lugar calmo perto de você",
  },
  {
    id: "por-do-sol",
    label: "Pôr do sol",
    emoji: "🌅",
    query: "Onde ver o pôr do sol?",
  },
  {
    id: "trilhas",
    label: "Trilhas rápidas",
    emoji: "🥾",
    query: "Trilhas rápidas para agora",
  },
  {
    id: "abertos",
    label: "Abertos agora",
    emoji: "🟢",
    query: "lugares abertos agora",
    filtro: FILTRO_STATUS_BUSCA.ABERTOS,
  },
];

/** Planos sugeridos de roteiro rápido na home (curadoria determinística). */
export { PLANOS_RAPIDOS } from "@/lib/planosRapidos";

/**
 * Ordena lugares pela distância ao usuário (mais perto primeiro).
 * @param {Array<Object>} lugares
 * @param {{ latitude: number, longitude: number }|null} userPosition
 * @returns {Array<Object>}
 */
export function sortLugaresPorDistancia(lugares, userPosition) {
  if (!userPosition) return lugares;

  return [...lugares].sort((a, b) => {
    const da = calcularDistanciaKm(userPosition, getCoordenadasLugar(a)) ?? 999;
    const db = calcularDistanciaKm(userPosition, getCoordenadasLugar(b)) ?? 999;
    return da - db;
  });
}

/** Coordenadas padrão de Imbituba (reexport). */
export { IMBITUBA_COORDS };
