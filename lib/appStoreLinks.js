/** Package ID Android — referência para montar o link da Play Store. */
export const PLAY_STORE_PACKAGE_ID = "app.guiadebolso";

/** URL pública na App Store (BR). `NEXT_PUBLIC_APP_STORE_URL` sobrescreve quando definido. */
export const APP_STORE_URL =
  "https://apps.apple.com/br/app/guia-de-bolso-imbituba/id6784377524";

/** URL pública na Google Play (BR). `NEXT_PUBLIC_PLAY_STORE_URL` sobrescreve quando definido. */
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_ID}`;

/**
 * @returns {string|null}
 */
function readPublicUrl(envKey) {
  const fromEnv = process.env[envKey]?.trim();
  return fromEnv || null;
}

/**
 * Links das lojas (preencher via env quando estiverem publicados).
 * @returns {{ appStore: string|null, playStore: string|null }}
 */
export function getAppStoreLinks() {
  return {
    appStore: readPublicUrl("NEXT_PUBLIC_APP_STORE_URL") ?? APP_STORE_URL,
    playStore: readPublicUrl("NEXT_PUBLIC_PLAY_STORE_URL") ?? PLAY_STORE_URL,
  };
}

/**
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isStoreLinkConfigured(url) {
  const value = String(url ?? "").trim();
  if (!value || value === "#") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Detecta plataforma a partir do User-Agent (servidor ou cliente).
 * @param {string|null|undefined} userAgent
 * @returns {"ios"|"android"|"other"}
 */
export function detectStorePlatform(userAgent) {
  const ua = String(userAgent ?? "").toLowerCase();
  if (!ua) return "other";

  if (/ipad|iphone|ipod/.test(ua) || (ua.includes("macintosh") && ua.includes("mobile"))) {
    return "ios";
  }

  if (/android/.test(ua)) {
    return "android";
  }

  return "other";
}

/**
 * URL da loja adequada à plataforma, se configurada.
 * @param {"ios"|"android"|"other"} platform
 * @param {{ appStore?: string|null, playStore?: string|null }} [links]
 * @returns {string|null}
 */
export function getStoreUrlForPlatform(platform, links = getAppStoreLinks()) {
  if (platform === "ios" && isStoreLinkConfigured(links.appStore)) {
    return links.appStore.trim();
  }
  if (platform === "android" && isStoreLinkConfigured(links.playStore)) {
    return links.playStore.trim();
  }
  return null;
}
