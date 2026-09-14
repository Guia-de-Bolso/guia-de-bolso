import { toCapacitorStaticHref } from "./capacitorNavigation.js";
import { safeRedirectPath } from "./safeRedirectPath.js";

/** Evento para soft-nav no app já hidratado (evita reload completo). */
export const PUSH_NAVIGATE_EVENT = "gb:push-navigate";

/** Marca que o cold-start já checou tap de push nesta sessão do WebView. */
export const PUSH_LAUNCH_CHECK_STORAGE_KEY = "gb_push_launch_checked_at";

/** Tempo máx. aguardando `pushNotificationActionPerformed` no boot. */
export const PUSH_COLD_START_WAIT_MS = 500;

/** Janela em que um check recente evita esperar de novo (ex.: após replace). */
export const PUSH_LAUNCH_CHECK_TTL_MS = 15_000;

/**
 * @param {unknown} notification
 * @returns {string | null}
 */
export function getPushNotificationTargetPath(notification) {
  const data =
    notification && typeof notification === "object" && "data" in notification
      ? notification.data
      : null;

  if (!data || typeof data !== "object") return null;

  const url = "url" in data ? data.url : null;
  if (typeof url !== "string" || !url.trim()) return null;

  return safeRedirectPath(url.trim(), null);
}

/**
 * Normaliza path/pathname(+search) para comparação com trailingSlash.
 * @param {string} href
 * @returns {string}
 */
export function normalizePushAppPath(href) {
  if (!href || typeof href !== "string") return "/";
  const [rawPath = "/", rawQuery = ""] = href.split("?");
  const withSlash = toCapacitorStaticHref(rawPath);
  return rawQuery ? `${withSlash}?${rawQuery}` : withSlash;
}

/**
 * @param {string} currentHref
 * @param {string} targetHref
 * @returns {boolean}
 */
export function isSamePushAppPath(currentHref, targetHref) {
  return normalizePushAppPath(currentHref) === normalizePushAppPath(targetHref);
}

/**
 * @param {number} [now]
 * @param {string | null} [storedTs]
 * @param {number} [ttlMs]
 * @returns {boolean}
 */
export function shouldSkipPushLaunchWait(
  now = Date.now(),
  storedTs = null,
  ttlMs = PUSH_LAUNCH_CHECK_TTL_MS
) {
  if (storedTs == null || storedTs === "") return false;
  const ts = Number(storedTs);
  if (!Number.isFinite(ts)) return false;
  return now - ts >= 0 && now - ts < ttlMs;
}
