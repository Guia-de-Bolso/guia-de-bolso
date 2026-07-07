/**
 * Detecta browser embutido do WhatsApp (Android/iOS).
 * @param {string} [userAgent]
 * @returns {boolean}
 */
export function isWhatsAppInAppBrowser(userAgent) {
  const ua = String(
    userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "")
  ).toLowerCase();
  return ua.includes("whatsapp");
}

/**
 * @param {string} [userAgent]
 * @returns {"ios"|"android"|"other"}
 */
export function detectOpenInAppPlatform(userAgent) {
  const ua = String(
    userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "")
  ).toLowerCase();

  if (/ipad|iphone|ipod/.test(ua) || (ua.includes("macintosh") && ua.includes("mobile"))) {
    return "ios";
  }
  if (/android/.test(ua)) {
    return "android";
  }
  return "other";
}
