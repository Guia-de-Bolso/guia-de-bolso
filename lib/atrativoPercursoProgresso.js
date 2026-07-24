/**
 * Progresso local do percurso de um atrativo (checklist de pontos).
 * @module lib/atrativoPercursoProgresso
 */

export const PERCURSO_PROGRESSO_PREFIX = "guia_atrativo_percurso_";

/**
 * @param {string|number} rotaId
 * @returns {string}
 */
export function getPercursoProgressoStorageKey(rotaId) {
  return `${PERCURSO_PROGRESSO_PREFIX}${String(rotaId)}`;
}

/**
 * Normaliza lista de IDs concluídos.
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeCompletedIds(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const ids = [];
  for (const item of value) {
    const id = String(item ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * @param {string|number} rotaId
 * @returns {{ completedIds: string[], updatedAt: number|null }}
 */
export function readPercursoProgresso(rotaId) {
  if (typeof window === "undefined" || rotaId == null || rotaId === "") {
    return { completedIds: [], updatedAt: null };
  }

  try {
    const raw = localStorage.getItem(getPercursoProgressoStorageKey(rotaId));
    if (!raw) return { completedIds: [], updatedAt: null };
    const parsed = JSON.parse(raw);
    return {
      completedIds: normalizeCompletedIds(parsed?.completedIds),
      updatedAt: Number.isFinite(parsed?.updatedAt) ? parsed.updatedAt : null,
    };
  } catch {
    return { completedIds: [], updatedAt: null };
  }
}

/**
 * @param {string|number} rotaId
 * @param {string[]} completedIds
 * @returns {{ completedIds: string[], updatedAt: number }}
 */
export function writePercursoProgresso(rotaId, completedIds) {
  const payload = {
    completedIds: normalizeCompletedIds(completedIds),
    updatedAt: Date.now(),
  };

  if (typeof window !== "undefined" && rotaId != null && rotaId !== "") {
    try {
      localStorage.setItem(getPercursoProgressoStorageKey(rotaId), JSON.stringify(payload));
    } catch {
      // Quota / modo privado — ignora.
    }
  }

  return payload;
}

/**
 * @param {string|number} rotaId
 */
export function clearPercursoProgresso(rotaId) {
  if (typeof window === "undefined" || rotaId == null || rotaId === "") return;
  try {
    localStorage.removeItem(getPercursoProgressoStorageKey(rotaId));
  } catch {
    // ignore
  }
}

/**
 * @param {string[]} completedIds
 * @param {string} pontoId
 * @param {boolean} done
 * @returns {string[]}
 */
export function togglePontoConcluido(completedIds, pontoId, done) {
  const id = String(pontoId ?? "").trim();
  if (!id) return normalizeCompletedIds(completedIds);

  const set = new Set(normalizeCompletedIds(completedIds));
  if (done) set.add(id);
  else set.delete(id);
  return [...set];
}

/**
 * Índice do próximo ponto ainda não concluído (ou o último se todos feitos).
 * @param {Array<{ id?: string }>} pontos
 * @param {string[]} completedIds
 * @returns {number}
 */
export function getProximoPontoIndex(pontos, completedIds) {
  const list = Array.isArray(pontos) ? pontos : [];
  if (list.length === 0) return 0;

  const done = new Set(normalizeCompletedIds(completedIds));
  const next = list.findIndex((ponto) => {
    const id = String(ponto?.id ?? "").trim();
    return id && !done.has(id);
  });

  if (next >= 0) return next;
  return list.length - 1;
}

/**
 * @param {number} completedCount
 * @param {number} total
 * @returns {number} 0–100
 */
export function getPercursoPercentual(completedCount, total) {
  const safeTotal = Number(total);
  if (!Number.isFinite(safeTotal) || safeTotal <= 0) return 0;
  const done = Math.max(0, Number(completedCount) || 0);
  return Math.min(100, Math.round((done / safeTotal) * 100));
}
