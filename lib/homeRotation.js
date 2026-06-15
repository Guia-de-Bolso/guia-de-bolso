/**
 * Rotação determinística por data/semana (America/Sao_Paulo).
 */

import { getCapaFromAtrativo } from "./fotos.js";

const TZ = "America/Sao_Paulo";

/**
 * @param {Date} [date]
 * @returns {string} YYYY-MM-DD
 */
export function hojeISO(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * @param {Date} [date]
 * @returns {string}
 */
export function dailySeed(date = new Date()) {
  return hojeISO(date);
}

/**
 * @param {Date} [date]
 * @returns {string}
 */
export function weeklySeed(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Hash estável string → inteiro não negativo.
 * @param {string} input
 * @returns {number}
 */
export function hashString(input) {
  let hash = 0;
  const str = String(input ?? "");
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * @param {string} id
 * @param {string} seed
 * @returns {number}
 */
export function scoreForSeed(id, seed) {
  return hashString(`${id}::${seed}`);
}

/**
 * @param {Array<T>} items
 * @param {string} seed
 * @returns {Array<T>}
 */
export function sortBySeed(items, seed) {
  return [...(items ?? [])].sort(
    (a, b) => scoreForSeed(String(a?.id ?? ""), seed) - scoreForSeed(String(b?.id ?? ""), seed)
  );
}

/**
 * @param {Array<T>} items
 * @param {string} seed
 * @returns {T|null}
 */
export function pickOneBySeed(items, seed) {
  const sorted = sortBySeed(items, seed);
  return sorted[0] ?? null;
}

/**
 * @param {Array<T>} items
 * @param {string} seed
 * @param {number} limit
 * @returns {Array<T>}
 */
export function pickManyBySeed(items, seed, limit) {
  return sortBySeed(items, seed).slice(0, Math.max(0, limit));
}

/** Data âncora do ciclo round-robin do hero de rotas. */
export const HERO_ATRATIVOS_EPOCH = "2026-01-01";

/**
 * Dias inteiros entre duas datas ISO (calendário, TZ São Paulo via strings YYYY-MM-DD).
 * @param {string} dateISO
 * @param {string} [epochISO]
 * @returns {number}
 */
export function daysSinceEpoch(dateISO, epochISO = HERO_ATRATIVOS_EPOCH) {
  const end = new Date(`${dateISO}T12:00:00`);
  const start = new Date(`${epochISO}T12:00:00`);
  if (Number.isNaN(end.getTime()) || Number.isNaN(start.getTime())) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

/**
 * @param {object} rota
 * @returns {boolean}
 */
export function atrativoTemImagem(rota) {
  return Boolean(getCapaFromAtrativo(rota));
}

/**
 * Rota do hero: round-robin diário (sem repetir até esgotar o pool).
 * @param {Array<object>} rotas
 * @param {string} [dateISO]
 * @param {string} [epochISO]
 * @returns {object|null}
 */
export function pickHeroAtrativoCiclo(
  rotas,
  dateISO = dailySeed(),
  epochISO = HERO_ATRATIVOS_EPOCH
) {
  const pool = (rotas ?? [])
    .filter((r) => r?.ativa !== false && atrativoTemImagem(r))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  if (!pool.length) return null;

  const idx = daysSinceEpoch(dateISO, epochISO) % pool.length;
  return pool[idx] ?? null;
}
