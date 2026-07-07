import { ANDROID_APP_PACKAGE } from "./appLinks.js";
import { detectStorePlatform, getStoreUrlForPlatform } from "./appStoreLinks.js";
import { SITE_DOMAIN, SITE_PUBLIC_URL } from "./siteContact.js";

/**
 * @param {string} path - Caminho interno (/lugares/...).
 * @returns {string}
 */
export function normalizeOpenInAppPath(path) {
  const raw = String(path || "/").trim();
  if (!raw || raw === "/") return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

/**
 * Link para abrir conteúdo no app nativo a partir do browser do WhatsApp.
 * @param {string} path
 * @param {"ios"|"android"|"other"} platform
 * @returns {string}
 */
export function buildOpenInNativeAppHref(path, platform) {
  const normalizedPath = normalizeOpenInAppPath(path);
  const httpsUrl = `${SITE_PUBLIC_URL.replace(/\/$/, "")}${normalizedPath}`;

  if (platform === "android") {
    const fallback = encodeURIComponent(httpsUrl);
    return `intent://${SITE_DOMAIN}${normalizedPath}#Intent;scheme=https;package=${ANDROID_APP_PACKAGE};S.browser_fallback_url=${fallback};end`;
  }

  if (platform === "ios") {
    return `app.guiadebolso://${SITE_DOMAIN}${normalizedPath}`;
  }

  return httpsUrl;
}

/**
 * URL da loja para quem ainda não tem o app instalado.
 * @param {"ios"|"android"|"other"} platform
 * @param {string} [userAgent]
 * @returns {string}
 */
export function buildStoreInstallHref(platform, userAgent) {
  const resolved =
    platform === "other" ? detectStorePlatform(userAgent) : platform;
  const storeUrl = getStoreUrlForPlatform(resolved);
  return storeUrl || `${SITE_PUBLIC_URL}/baixar`;
}
