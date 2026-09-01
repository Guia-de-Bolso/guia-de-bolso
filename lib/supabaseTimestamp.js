import { USAGE_TIMEZONE, getUsageDayKey } from "./premium.js";

/**
 * PostgREST devolve `timestamp without time zone` sem sufixo (ex.: `2026-05-23T03:56:39.521112`).
 * No Supabase o valor é UTC; sem o `Z`, o JS trata como horário local (+3h em Brasília).
 * @param {string|number|Date|null|undefined} value
 * @returns {Date|null}
 */
export function parseSupabaseTimestamp(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/[zZ]$/.test(raw)) return new Date(raw);
  if (/[+-]\d{2}:\d{2}$/.test(raw)) return new Date(raw);

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(`${normalized}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Meia-noite de um dia civil em Brasília, como string UTC para comparar com `logs.created_at`.
 * @param {string} dayKey - `YYYY-MM-DD` (fuso São Paulo)
 * @returns {string}
 */
export function getBrasiliaDayStartDbString(dayKey) {
  return `${dayKey}T03:00:00.000000`;
}

/**
 * Último instante do dia civil em Brasília (UTC wall, sem `Z`).
 * @param {string} dayKey - `YYYY-MM-DD` (fuso São Paulo)
 * @returns {string}
 */
export function getBrasiliaDayEndDbString(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const nextMidnightUtc = new Date(Date.UTC(year, month - 1, day + 1, 3, 0, 0, 0));
  return new Date(nextMidnightUtc.getTime() - 1).toISOString().replace("Z", "");
}

/**
 * Início do período (N dias atrás, inclusive) no calendário de Brasília.
 * @param {number} [days=7] - `0` = hoje
 * @returns {string}
 */
export function getBrasiliaPeriodStartDbString(days = 7) {
  const todayKey = getUsageDayKey(new Date());
  if (days === 0) {
    return getBrasiliaDayStartDbString(todayKey);
  }

  const [year, month, day] = todayKey.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() - days);
  return getBrasiliaDayStartDbString(getUsageDayKey(anchor));
}

export { USAGE_TIMEZONE };
