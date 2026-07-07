import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { getLugarPublicUrl } from "./lugarPublicPath.js";
import { SITE_PUBLIC_URL } from "./siteContact.js";

/** Mensagem exibida quando o link é copiado (fallback sem sheet nativo). */
export const SHARE_COPIED_MESSAGE = "Link copiado!";

/**
 * @returns {boolean}
 */
function isCapacitorNative() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isShareCancelled(error) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  return (
    name === "AbortError" ||
    /cancel|abort|dismiss/i.test(message) ||
    message === "Share canceled"
  );
}

/**
 * Erros do plugin nativo ou Web Share que permitem tentar outro canal.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isRecoverableShareError(error) {
  if (isShareCancelled(error)) return false;
  if (!error || typeof error !== "object") return true;
  const code = "code" in error ? String(error.code) : "";
  if (code === "UNIMPLEMENTED" || code === "UNAVAILABLE") return true;
  const name = "name" in error ? String(error.name) : "";
  return name === "NotAllowedError" || name === "TypeError" || name === "InvalidStateError";
}

/**
 * URL absoluta pública para compartilhamento (sempre guiadebolso.app).
 * @param {string} path - Caminho começando com /.
 * @returns {string}
 */
export function buildSharePublicUrl(path) {
  const base = SITE_PUBLIC_URL.replace(/\/$/, "");
  const normalized = String(path || "/").startsWith("/") ? String(path) : `/${path}`;
  return `${base}${normalized}`;
}

/**
 * @param {{ id?: string, slug?: string|null }} lugar
 * @returns {string}
 */
export function getLugarShareUrl(lugar) {
  return getLugarPublicUrl(lugar, SITE_PUBLIC_URL);
}

/**
 * @param {string} rotaId
 * @returns {string}
 */
export function getAtrativoShareUrl(rotaId) {
  const id = String(rotaId || "").trim();
  return buildSharePublicUrl(`/atrativos/${encodeURIComponent(id)}`);
}

/**
 * Combinações aceitas pela Web Share API (alguns browsers rejeitam title+text+url).
 * @param {{ title?: string, text?: string, url: string }} payload
 * @returns {Array<{ title?: string, text?: string, url?: string }>}
 */
export function buildWebSharePayloads({ title, text, url }) {
  const shareUrl = String(url || "").trim();
  const safeTitle = title?.trim() || undefined;
  const safeText = text?.trim() || undefined;
  const candidates = [
    { title: safeTitle, text: safeText, url: shareUrl },
    { title: safeTitle, url: shareUrl },
    { url: shareUrl },
    safeText ? { text: safeText, url: shareUrl } : null,
  ].filter(Boolean);

  const seen = new Set();
  return candidates.filter((item) => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * @param {{ title?: string, text?: string, url: string }} payload
 * @returns {Promise<"shared" | "cancelled" | null>}
 */
async function tryNativeCapacitorShare(payload) {
  if (!isCapacitorNative() || !Capacitor.isPluginAvailable("Share")) {
    return null;
  }

  try {
    await Share.share({
      ...payload,
      dialogTitle: "Compartilhar",
    });
    return "shared";
  } catch (error) {
    if (isShareCancelled(error)) return "cancelled";
    if (isRecoverableShareError(error)) return null;
    throw error;
  }
}

/**
 * @param {{ title?: string, text?: string, url: string }} payload
 * @returns {Promise<"shared" | "cancelled" | null>}
 */
async function tryWebShare(payload) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return null;
  }

  for (const data of buildWebSharePayloads(payload)) {
    if (typeof navigator.canShare === "function" && !navigator.canShare(data)) {
      continue;
    }

    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if (isShareCancelled(error)) return "cancelled";
      if (!isRecoverableShareError(error)) throw error;
    }
  }

  return null;
}

/**
 * @param {string} shareUrl
 * @returns {Promise<"copied">}
 */
async function copyShareUrl(shareUrl) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return "copied";
    } catch {
      // WebViews nativos às vece bloqueiam a Clipboard API.
    }
  }

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.value = shareUrl;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      if (copied) return "copied";
    } finally {
      document.body.removeChild(textarea);
    }
  }

  throw new Error("Compartilhamento não suportado neste dispositivo");
}

/**
 * Compartilha conteúdo: sheet nativo no app (Capacitor), Web Share API ou clipboard.
 * @param {{ title?: string, text?: string, url: string }} payload
 * @returns {Promise<"shared" | "copied" | "cancelled">}
 */
export async function shareContent(payload) {
  const shareUrl = String(payload?.url || "").trim();
  if (!shareUrl) {
    throw new Error("shareContent: url é obrigatória");
  }

  const normalizedPayload = {
    title: payload.title,
    text: payload.text,
    url: shareUrl,
  };

  const nativeResult = await tryNativeCapacitorShare(normalizedPayload);
  if (nativeResult) return nativeResult;

  const webResult = await tryWebShare(normalizedPayload);
  if (webResult) return webResult;

  return copyShareUrl(shareUrl);
}
