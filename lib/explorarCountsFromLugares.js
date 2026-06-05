import {
  CATEGORIAS_EXPLORE,
  getCategoriasEmDestaque,
  sortCategoriasPorContagem,
} from "./categorias.js";
import { getCapaFromLugar } from "./fotos.js";
import { normalizeLugaresTaxonomia } from "./lugarTaxonomia.js";

const CATEGORIA_NOMES = new Set(CATEGORIAS_EXPLORE.map((item) => item.nome));

/**
 * Agrega contagens e capas a partir de lugares (categoria efetiva via taxonomia).
 * @param {Array<object>} lugares
 * @returns {{
 *   counts: Record<string, number>,
 *   capas: Record<string, string>,
 *   totalLugares: number,
 *   categoriasComLugares: number,
 *   destaques: string[],
 *   categorias: string[],
 * }}
 */
export function buildExplorarCountsFromLugares(lugares) {
  const normalized = normalizeLugaresTaxonomia(lugares ?? []);
  /** @type {Record<string, number>} */
  const counts = {};
  /** @type {Record<string, string>} */
  const capas = {};

  for (const lugar of normalized) {
    const cat = String(lugar.categoria ?? "").trim();
    if (!cat || !CATEGORIA_NOMES.has(cat)) continue;

    counts[cat] = (counts[cat] || 0) + 1;

    if (!capas[cat]) {
      const capa = getCapaFromLugar(lugar);
      if (capa) capas[cat] = capa;
    }
  }

  const categoriasOrdenadas = sortCategoriasPorContagem(CATEGORIAS_EXPLORE, counts);
  const destaques = getCategoriasEmDestaque(CATEGORIAS_EXPLORE, counts, 3);
  const totalLugares = CATEGORIAS_EXPLORE.reduce(
    (acc, item) => acc + (counts[item.nome] || 0),
    0
  );
  const categoriasComLugares = categoriasOrdenadas.filter(
    (item) => (counts[item.nome] || 0) > 0
  ).length;

  return {
    counts,
    capas,
    totalLugares,
    categoriasComLugares,
    destaques: destaques.map((item) => item.nome),
    categorias: categoriasOrdenadas.map((item) => item.nome),
  };
}
