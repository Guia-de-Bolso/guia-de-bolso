/**
 * Helpers de JWT / audience para Google ID token (testáveis sem Capacitor).
 */

/**
 * @param {string} token
 * @returns {Record<string, unknown> | null}
 */
export function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Extrai claim `aud` do payload JWT (string ou array).
 * @param {Record<string, unknown> | null} decoded
 * @returns {string}
 */
export function getTokenAudience(decoded) {
  if (!decoded) return "";
  if (typeof decoded.aud === "string") return decoded.aud;
  if (Array.isArray(decoded.aud)) {
    const first = decoded.aud.find((value) => typeof value === "string");
    return typeof first === "string" ? first : "";
  }
  return "";
}

/**
 * @param {unknown} audience
 * @param {string[]} acceptedAudiences
 * @returns {boolean}
 */
export function isAcceptedGoogleTokenAudience(audience, acceptedAudiences) {
  if (typeof audience !== "string" || !audience) return false;
  if (!Array.isArray(acceptedAudiences) || acceptedAudiences.length === 0) {
    return false;
  }
  return acceptedAudiences.includes(audience);
}
