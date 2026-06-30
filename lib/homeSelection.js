import { getCategoriasVisiveis } from "@/lib/categorias";
import { getCapaFromLugar } from "@/lib/fotos";
import { isConteudoCuradoria, isParceiro } from "@/lib/lugarBadges";
import {
  dailySeed,
  pickManyBySeed,
  pickOneBySeed,
  pickHeroAtrativoCiclo,
  sortBySeed,
  weeklySeed,
} from "@/lib/homeRotation";

const EM_ALTA_LIMIT = 6;

/**
 * @param {object} lugar
 * @returns {boolean}
 */
export function lugarTemImagem(lugar) {
  return Boolean(getCapaFromLugar(lugar));
}

/**
 * Um parceiro por categoria, rotação semanal.
 * @param {Array<object>} lugares
 * @param {string} [weekSeed]
 * @returns {Array<object>}
 */
export function pickParceirosPorCategoria(lugares, weekSeed = weeklySeed()) {
  const parceiros = (lugares ?? []).filter((l) => isParceiro(l));
  const byCategoria = new Map();

  for (const lugar of parceiros) {
    const cat = lugar.categoria;
    if (!cat) continue;
    if (!byCategoria.has(cat)) byCategoria.set(cat, []);
    byCategoria.get(cat).push(lugar);
  }

  const ordem = getCategoriasVisiveis().map((c) => c.nome);
  const out = [];

  for (const categoria of ordem) {
    const grupo = byCategoria.get(categoria);
    if (!grupo?.length) continue;
    const escolhido = pickOneBySeed(grupo, `${weekSeed}::${categoria}`);
    if (escolhido) out.push(escolhido);
  }

  return out;
}

/**
 * Todos os parceiros ativos com capa, ordenados por nome.
 * @param {Array<object>} lugares
 * @returns {Array<object>}
 */
export function pickAllParceiros(lugares) {
  return (lugares ?? [])
    .filter((l) => isParceiro(l) && lugarTemImagem(l))
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
}

/**
 * Lista diária de curadoria para "Em alta hoje".
 * @param {Array<object>} lugares
 * @param {number} [limit]
 * @param {string} [dateISO]
 * @returns {Array<object>}
 */
export function pickEmAltaCuradoria(lugares, limit = EM_ALTA_LIMIT, dateISO = dailySeed()) {
  const pool = (lugares ?? []).filter((l) => isConteudoCuradoria(l));
  return pickManyBySeed(pool, dateISO, limit);
}

/**
 * @param {Array<object>} lugares
 * @param {string} heroId
 * @param {number} [limit]
 * @returns {Array<object>}
 */
export function filterAtivosComDistancia(lugares) {
  return (lugares ?? []).filter((l) => l?.status === "ativo" || !l?.status);
}

export { sortBySeed, dailySeed, weeklySeed, pickHeroAtrativoCiclo };
