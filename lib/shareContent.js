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
 * Compartilha conteúdo: sheet nativo no app (Capacitor), Web Share API ou clipboard.
 * @param {{ title?: string, text?: string, url: string }} payload
 * @returns {Promise<"shared" | "copied" | "cancelled">}
 */
export async function shareContent({ title, text, url }) {
  const shareUrl = String(url || "").trim();
  if (!shareUrl) {
    throw new Error("shareContent: url é obrigatória");
  }

  const sharePayload = {
    title: title?.trim() || undefined,
    text: text?.trim() || undefined,
    url: shareUrl,
  };

  try {
    if (isCapacitorNative()) {
      await Share.share({
        ...sharePayload,
        dialogTitle: "Compartilhar",
      });
      return "shared";
    }

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share(sharePayload);
      return "shared";
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return "copied";
    }

    throw new Error("Compartilhamento não suportado neste dispositivo");
  } catch (error) {
    if (isShareCancelled(error)) {
      return "cancelled";
    }
    throw error;
  }
}
