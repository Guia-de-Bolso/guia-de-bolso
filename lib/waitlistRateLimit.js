/** Janela e limite para POST /api/waitlist (memória local — trocar por Redis em escala). */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 8;

/** @type {Map<string, number[]>} */
const buckets = new Map();

/**
 * @param {string} key
 * @returns {boolean} true se permitido
 */
export function checkWaitlistRateLimit(key) {
  const now = Date.now();
  const id = String(key || "anon").slice(0, 128);
  const hits = (buckets.get(id) ?? []).filter((t) => now - t < WINDOW_MS);

  if (hits.length >= MAX_PER_WINDOW) {
    buckets.set(id, hits);
    return false;
  }

  hits.push(now);
  buckets.set(id, hits);
  return true;
}
