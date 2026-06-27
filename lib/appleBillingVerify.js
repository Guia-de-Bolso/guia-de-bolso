import jwt from "jsonwebtoken";
import { APPLE_BUNDLE_ID, APPLE_PREMIUM_PRODUCT_ID } from "./applePremiumConfig.js";

const APP_STORE_API_PRODUCTION = "https://api.storekit.itunes.apple.com";
const APP_STORE_API_SANDBOX = "https://api.storekit-sandbox.itunes.apple.com";

/**
 * @typedef {Object} AppleSubscriptionVerification
 * @property {boolean} valid
 * @property {string} [code]
 * @property {string} [message]
 * @property {string} [transactionId]
 * @property {string} [originalTransactionId]
 * @property {string} [productId]
 * @property {string|null} [expiresAt] - ISO 8601
 */

/**
 * @param {string} jws
 * @returns {Record<string, unknown>|null}
 */
export function decodeAppleJwsPayload(jws) {
  const parts = String(jws ?? "").split(".");
  if (parts.length !== 3) return null;

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Normaliza chave .p8 da Apple para PEM (aceita com ou sem cabeçalhos BEGIN/END).
 * @param {string|null|undefined} raw
 * @returns {string|null}
 */
export function normalizeApplePrivateKey(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;

  const unescaped = trimmed.replace(/\\n/g, "\n").trim();

  if (/-----BEGIN (?:EC )?PRIVATE KEY-----/.test(unescaped)) {
    return unescaped;
  }

  const body = unescaped.replace(/\s+/g, "");
  if (!body) return null;

  const lines = body.match(/.{1,64}/g) ?? [body];

  return ["-----BEGIN PRIVATE KEY-----", ...lines, "-----END PRIVATE KEY-----"].join("\n");
}

/**
 * @returns {string|null}
 */
function loadApplePrivateKey() {
  return normalizeApplePrivateKey(process.env.APPLE_IAP_PRIVATE_KEY);
}

/**
 * @returns {string|null}
 */
function createAppStoreServerJwt() {
  const privateKey = loadApplePrivateKey();
  const issuerId = process.env.APPLE_IAP_ISSUER_ID?.trim();
  const keyId = process.env.APPLE_IAP_KEY_ID?.trim();
  const bundleId = process.env.APPLE_IAP_BUNDLE_ID?.trim() || APPLE_BUNDLE_ID;

  if (!privateKey || !issuerId || !keyId) return null;

  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: issuerId,
      iat: now,
      exp: now + 3600,
      aud: "appstoreconnect-v1",
      bid: bundleId,
    },
    privateKey,
    {
      algorithm: "ES256",
      header: {
        alg: "ES256",
        kid: keyId,
        typ: "JWT",
      },
    }
  );
}

/**
 * @param {string} baseUrl
 * @param {string} transactionId
 * @param {string} token
 * @returns {Promise<{ ok: boolean, payload?: Record<string, unknown>, status?: number }>}
 */
async function fetchAppleTransaction(baseUrl, transactionId, token) {
  const url = `${baseUrl}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`;

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 503 };
  }

  if (response.status === 404) {
    return { ok: false, status: 404 };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("fetchAppleTransaction:", response.status, detail.slice(0, 300));
    return { ok: false, status: response.status };
  }

  /** @type {{ signedTransactionInfo?: string }} */
  const body = await response.json();
  const payload = decodeAppleJwsPayload(body?.signedTransactionInfo ?? "");

  if (!payload) {
    return { ok: false, status: 500 };
  }

  return { ok: true, payload };
}

/**
 * @param {Record<string, unknown>} payload
 * @param {string} expectedProductId
 * @returns {AppleSubscriptionVerification}
 */
function validateAppleTransactionPayload(payload, expectedProductId) {
  const bundleId = process.env.APPLE_IAP_BUNDLE_ID?.trim() || APPLE_BUNDLE_ID;
  const payloadBundleId = String(payload.bundleId ?? "");
  const productId = String(payload.productId ?? "");
  const transactionId = String(payload.transactionId ?? "");
  const originalTransactionId = String(payload.originalTransactionId ?? transactionId);
  const revocationDate = payload.revocationDate ?? null;

  if (payloadBundleId && payloadBundleId !== bundleId) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Compra não pertence a este app.",
    };
  }

  if (productId !== expectedProductId) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Produto da compra não corresponde à assinatura Premium.",
    };
  }

  if (revocationDate) {
    return {
      valid: false,
      code: "PURCHASE_EXPIRED",
      message: "Assinatura revogada ou reembolsada.",
    };
  }

  const expiresMs = Number(payload.expiresDate ?? 0);
  const expiresAt =
    Number.isFinite(expiresMs) && expiresMs > 0 ? new Date(expiresMs).toISOString() : null;

  if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
    return {
      valid: false,
      code: "PURCHASE_EXPIRED",
      message: "Assinatura inativa ou expirada.",
    };
  }

  return {
    valid: true,
    transactionId,
    originalTransactionId,
    productId,
    expiresAt,
  };
}

/**
 * Valida transação Apple via App Store Server API (produção, depois sandbox).
 * @param {{ transactionId: string, productId: string }} params
 * @returns {Promise<AppleSubscriptionVerification>}
 */
export async function verifyAppleSubscription({ transactionId, productId }) {
  if (!transactionId || !productId) {
    return {
      valid: false,
      code: "VALIDATION",
      message: "Transação ou produto da compra ausente.",
    };
  }

  const token = createAppStoreServerJwt();
  if (!token) {
    return {
      valid: false,
      code: "SERVER",
      message: "Verificação App Store não configurada no servidor.",
    };
  }

  const useSandboxOnly = process.env.APPLE_IAP_USE_SANDBOX === "true";
  const bases = useSandboxOnly
    ? [APP_STORE_API_SANDBOX]
    : [APP_STORE_API_PRODUCTION, APP_STORE_API_SANDBOX];

  for (const baseUrl of bases) {
    const result = await fetchAppleTransaction(baseUrl, transactionId, token);
    if (!result.ok) continue;

    return validateAppleTransactionPayload(result.payload ?? {}, productId);
  }

  return {
    valid: false,
    code: "PURCHASE_INVALID",
    message: "Não foi possível validar a compra na App Store.",
  };
}

/**
 * @returns {boolean}
 */
export function isAppleBillingVerifyConfigured() {
  return Boolean(
    loadApplePrivateKey() &&
      process.env.APPLE_IAP_ISSUER_ID?.trim() &&
      process.env.APPLE_IAP_KEY_ID?.trim()
  );
}
