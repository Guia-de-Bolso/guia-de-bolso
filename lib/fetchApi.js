import { APP_AUTH_ORIGIN } from "./authOrigins.js";

/**
 * Origem remota das Route Handlers quando o app roda com bundle local no Capacitor.
 * Definida em build via NEXT_PUBLIC_CAPACITOR_API_ORIGIN (ex.: https://app.guiadebolso.app).
 * @returns {string}
 */
export function getCapacitorApiOrigin() {
  const configured = process.env.NEXT_PUBLIC_CAPACITOR_API_ORIGIN?.trim();
  return configured ? configured.replace(/\/$/, "") : "";
}

/**
 * @param {string} path
 * @returns {string}
 */
export function resolveApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = getCapacitorApiOrigin();
  if (!origin) return normalizedPath;
  return `${origin}${normalizedPath}`;
}

/**
 * fetch para `/api/*` — no bundle local do Capacitor usa a API em produção.
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
export function fetchApi(path, init = {}) {
  const { credentials = "include", ...rest } = init;

  return fetch(resolveApiUrl(path), {
    credentials,
    ...rest,
  });
}

/**
 * Origem efetiva do app (útil para logs e diagnósticos).
 * @returns {string}
 */
export function getEffectiveAppOrigin() {
  return getCapacitorApiOrigin() || APP_AUTH_ORIGIN;
}
