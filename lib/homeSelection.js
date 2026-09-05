import { getCategoriasVisiveis } from "./categorias.js";
import { getCapaFromLugar } from "./fotos.js";
import { isParceiro } from "./lugarBadges.js";
import { normalizeDateISO } from "./parceiroAdmin.js";
import { filterLugaresPublicos } from "./publicCatalog.js";
import {
  dailySeed,
  pickManyBySeed,
  pickOneBySeed,
  pickHeroAtrativoCiclo,
  sortBySeed,
  weeklySeed,
} from "./homeRotation.js";

const EM_ALTA_LIMIT = 6;
export const PARCEIROS_CARROSSEL_LIMIT = 10;

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
 * Data usada para destacar o parceiro mais recente no carrossel da home.
 * @param {object} lugar
 * @returns {string}
 */
export function getParceiroDestaqueDate(lugar) {
  const inicio = normalizeDateISO(lugar?.parceiro_inicio_em);
  if (inicio) return inicio;

  const created = String(lugar?.created_at ?? "").trim();
  if (created) {
    const iso = created.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  }

  return "";
}

/**
 * Parceiro ativo mais recente (último adicionado ao programa).
 * @param {Array<object>} parceiros
 * @returns {object|null}
 */
export function pickNewestParceiro(parceiros) {
  const pool = (parceiros ?? []).filter((l) => isParceiro(l));
  if (!pool.length) return null;

  return [...pool].sort((a, b) => {
    const dateCmp = getParceiroDestaqueDate(b).localeCompare(getParceiroDestaqueDate(a));
    if (dateCmp !== 0) return dateCmp;
    return String(b.id ?? "").localeCompare(String(a.id ?? ""));
  })[0];
}

/**
 * Carrossel da home: até 10 parceiros com capa; o mais recente sempre primeiro;
 * demais em ordem pseudo-aleatória diária (determinística).
 * @param {Array<object>} lugares
 * @param {string} [dateISO]
 * @returns {Array<object>}
 */
export function pickParceirosCarrossel(lugares, dateISO = dailySeed()) {
  const parceiros = (lugares ?? []).filter((l) => isParceiro(l) && lugarTemImagem(l));
  if (!parceiros.length) return [];

  const newest = pickNewestParceiro(parceiros);
  const rest = newest
    ? parceiros.filter((lugar) => String(lugar.id) !== String(newest.id))
    : parceiros;
  const rotated = sortBySeed(rest, dateISO);
  const ordered = newest ? [newest, ...rotated] : rotated;

  return ordered.slice(0, PARCEIROS_CARROSSEL_LIMIT);
}

/**
 * Lista diária de curadoria para "Em alta hoje".
 * @param {Array<object>} lugares
 * @param {number} [limit]
 * @param {string} [dateISO]
 * @returns {Array<object>}
 */
export function pickEmAltaCuradoria(lugares, limit = EM_ALTA_LIMIT, dateISO = dailySeed()) {
  const pool = filterLugaresPublicos(lugares ?? []);
  return pickManyBySeed(pool, dateISO, limit);
}

/**
 * @param {Array<object>} lugares
 * @param {string} heroId
 * @param {number} [limit]
 * @returns {Array<object>}
 */
export { sortBySeed, dailySeed, weeklySeed, pickHeroAtrativoCiclo };
