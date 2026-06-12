const RETURN_PARAM = "from";

/**
 * Lê rota interna de retorno a partir da query string.
 * @param {URLSearchParams|{ get?: (key: string) => string|null }} [searchParams]
 * @param {string} [fallback="/"]
 * @returns {string}
 */
export function getReturnPathFromSearch(searchParams, fallback = "/") {
  const raw = searchParams?.get?.(RETURN_PARAM);
  if (!raw || typeof raw !== "string") return fallback;

  try {
    const decoded = decodeURIComponent(raw.trim());
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
    return decoded;
  } catch {
    return fallback;
  }
}

/**
 * Anexa `?from=` a um path interno (para voltar à tela anterior).
 * @param {string} path
 * @param {string} [returnPath]
 * @returns {string}
 */
export function appendReturnToPath(path, returnPath) {
  const base = String(path ?? "").trim();
  if (!base) return "/";

  const from = String(returnPath ?? "").trim();
  if (!from.startsWith("/") || from.startsWith("//")) return base;

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${RETURN_PARAM}=${encodeURIComponent(from)}`;
}
