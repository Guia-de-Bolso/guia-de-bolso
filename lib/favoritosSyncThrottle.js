const SYNC_THROTTLE_MS = 2 * 60 * 1000;
const STORAGE_KEY = "guia_favoritos_last_bg_sync";

/**
 * @returns {number|null}
 */
export function getLastBackgroundSyncAt() {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * @param {number} timestamp
 */
export function markBackgroundSyncAt(timestamp = Date.now()) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, String(timestamp));
}

/**
 * @param {number} [now]
 * @returns {boolean}
 */
export function shouldRunBackgroundSync(now = Date.now()) {
  const last = getLastBackgroundSyncAt();
  if (!last) return true;
  return now - last >= SYNC_THROTTLE_MS;
}
