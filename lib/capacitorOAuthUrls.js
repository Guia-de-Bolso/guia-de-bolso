import { NATIVE_OAUTH_CALLBACK } from "./authOrigins.js";
import { safeRedirectPath } from "./safeRedirectPath.js";

/** Prefixo do callback OAuth nativo (sem query). */
export const NATIVE_OAUTH_CALLBACK_PREFIX = "app.guiadebolso://auth/callback";

/**
 * @param {string} postLoginPath
 * @returns {string}
 */
export function buildNativeOAuthRedirectUrl(postLoginPath = "/") {
  const next = safeRedirectPath(postLoginPath);
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  return `${NATIVE_OAUTH_CALLBACK}${nextQuery}`;
}

/**
 * @param {string} url
 * @returns {URL|null}
 */
export function parseNativeOAuthCallbackUrl(url) {
  if (!url || !url.startsWith(NATIVE_OAUTH_CALLBACK_PREFIX)) {
    return null;
  }

  try {
    return new URL(url);
  } catch {
    return null;
  }
}
