/**
 * Gera appAccountToken determinístico em formato UUID exigido pelo StoreKit 2.
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function getAppleAppAccountToken(userId) {
  const normalized = String(userId ?? "").trim();
  if (!normalized) {
    throw new Error("userId obrigatório para appAccountToken");
  }

  if (typeof crypto?.subtle?.digest !== "function") {
    throw new Error("Web Crypto indisponível para gerar appAccountToken");
  }

  const input = new TextEncoder().encode(`guia-premium:${normalized}`);
  const buffer = await crypto.subtle.digest("SHA-256", input);
  const bytes = new Uint8Array(buffer);

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes.slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
