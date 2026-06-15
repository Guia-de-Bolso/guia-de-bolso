/**
 * Atrativo do dia — rotação diária (SP) com override opcional de fixação no admin.
 * @module lib/atrativoDoDia
 */

import {
  HERO_ATRATIVOS_EPOCH,
  dailySeed,
  daysSinceEpoch,
  hojeISO,
  pickHeroAtrativoCiclo,
} from "./homeRotation.js";

/** Dias de fixação oferecidos no admin. */
export const ATRATIVO_DO_DIA_FIXAR_OPCOES = [
  { dias: 1, label: "Hoje" },
  { dias: 3, label: "3 dias" },
  { dias: 7, label: "7 dias" },
  { dias: 14, label: "14 dias" },
];

/**
 * @param {object|null|undefined} rota
 * @returns {boolean}
 */
export function isAtrativoPublicado(rota) {
  return rota?.ativa !== false;
}

/**
 * @param {string} ateISO - Data YYYY-MM-DD (último dia inclusivo da fixação).
 * @param {string} [dayKey]
 * @returns {boolean}
 */
export function isFixacaoVigente(ateISO, dayKey = dailySeed()) {
  const ate = String(ateISO ?? "").slice(0, 10);
  if (!ate) return false;
  return ate >= dayKey;
}

/**
 * @param {object|null|undefined} rota
 * @param {string} [dayKey]
 * @returns {boolean}
 */
export function isAtrativoFixadoHoje(rota, dayKey = dailySeed()) {
  return isAtrativoPublicado(rota) && isFixacaoVigente(rota?.rota_do_dia_fixada_ate, dayKey);
}

/**
 * Soma dias a uma chave YYYY-MM-DD (calendário).
 * @param {string} dayKey
 * @param {number} days
 * @returns {string}
 */
export function addDaysToDayKey(dayKey, days) {
  const base = new Date(`${dayKey}T12:00:00`);
  base.setDate(base.getDate() + days);
  return hojeISO(base);
}

/**
 * Último dia inclusivo ao fixar por N dias a partir de `startDay`.
 * @param {number} numDias - Mínimo 1.
 * @param {string} [startDay]
 * @returns {string|null}
 */
export function computeFixadaAteInclusive(numDias, startDay = dailySeed()) {
  const n = Number(numDias);
  if (!Number.isFinite(n) || n < 1) return null;
  return addDaysToDayKey(startDay, n - 1);
}

/**
 * Rotação round-robin diária entre rotas publicadas (sem exigir capa).
 * @param {Array<object>} rotas
 * @param {string} [dayKey]
 * @param {string} [epochISO]
 * @returns {object|null}
 */
export function pickAtrativoDoDiaRotativo(
  rotas,
  dayKey = dailySeed(),
  epochISO = HERO_ATRATIVOS_EPOCH
) {
  const pool = (rotas ?? [])
    .filter(isAtrativoPublicado)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  if (!pool.length) return null;

  const idx = daysSinceEpoch(dayKey, epochISO) % pool.length;
  return pool[idx] ?? null;
}

/**
 * Rota com fixação vigente (se houver mais de uma, prioriza a que termina mais tarde).
 * @param {Array<object>} rotas
 * @param {string} [dayKey]
 * @returns {object|null}
 */
export function findAtrativoDoDiaFixado(rotas, dayKey = dailySeed()) {
  const fixadas = (rotas ?? []).filter((rota) => isAtrativoFixadoHoje(rota, dayKey));

  if (!fixadas.length) return null;

  fixadas.sort((a, b) => {
    const cmp = String(b.rota_do_dia_fixada_ate).localeCompare(
      String(a.rota_do_dia_fixada_ate)
    );
    if (cmp !== 0) return cmp;
    return String(a.id).localeCompare(String(b.id));
  });

  return fixadas[0];
}

/**
 * Resolve a rota do dia: fixação admin ou rotação diária.
 * @param {Array<object>} rotas
 * @param {{ dayKey?: string, requireCapa?: boolean }} [options]
 * @returns {{ rota: object|null, modo: "fixada"|"rotativa"|null, dayKey: string }}
 */
export function resolveAtrativoDoDia(rotas, options = {}) {
  const dayKey = options.dayKey ?? dailySeed();
  const pool = (rotas ?? []).filter(isAtrativoPublicado);

  const fixada = findAtrativoDoDiaFixado(pool, dayKey);
  if (fixada) {
    return { rota: fixada, modo: "fixada", dayKey };
  }

  const rotativa = options.requireCapa
    ? pickHeroAtrativoCiclo(pool, dayKey)
    : pickAtrativoDoDiaRotativo(pool, dayKey);

  return {
    rota: rotativa,
    modo: rotativa ? "rotativa" : null,
    dayKey,
  };
}

/**
 * Fixa uma rota como "rota do dia" por N dias (limpa fixação das demais).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} rotaId
 * @param {number} numDias
 * @returns {Promise<{ ate: string|null, error: import('@supabase/supabase-js').PostgrestError|null }>}
 */
export async function aplicarFixacaoAtrativoDoDia(supabase, rotaId, numDias) {
  const ate = computeFixadaAteInclusive(numDias);
  if (!ate) {
    return { ate: null, error: { message: "Número de dias inválido." } };
  }

  const { error: clearError } = await supabase
    .from("rotas")
    .update({ rota_do_dia_fixada_ate: null })
    .neq("id", rotaId);

  if (clearError) {
    return { ate: null, error: clearError };
  }

  const { error } = await supabase
    .from("rotas")
    .update({ rota_do_dia_fixada_ate: ate })
    .eq("id", rotaId);

  return { ate, error: error ?? null };
}

/**
 * Remove fixação de rota do dia.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} rotaId
 * @returns {Promise<{ error: import('@supabase/supabase-js').PostgrestError|null }>}
 */
export async function removerFixacaoAtrativoDoDia(supabase, rotaId) {
  const { error } = await supabase
    .from("rotas")
    .update({ rota_do_dia_fixada_ate: null })
    .eq("id", rotaId);

  return { error: error ?? null };
}
