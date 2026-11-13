import jwt from "jsonwebtoken";
import { APPLE_BUNDLE_ID } from "./applePremiumConfig.js";

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
      keyid: keyId,
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
    console.error("fetchAppleTransaction:", response.status);
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

/** Ambientes em que a flag de JWS local pode existir. Produção e valor ausente ficam de fora. */
const UNVERIFIED_JWS_VERCEL_ENVS = new Set(["development", "preview"]);

/**
 * A flag só vale com VERCEL_ENV exatamente development ou preview.
 * Ausência, production e qualquer outro valor desligam o atalho.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean}
 */
export function isUnverifiedAppleJwsAllowed(env = process.env) {
  if (String(env.APPLE_IAP_ALLOW_UNVERIFIED_JWS ?? "").trim() !== "true") return false;
  const vercelEnv = String(env.VERCEL_ENV ?? "").trim().toLowerCase();
  return UNVERIFIED_JWS_VERCEL_ENVS.has(vercelEnv);
}

/**
 * @param {unknown} value
 * @returns {"Sandbox"|"Production"|"Xcode"|""}
 */
function normalizeAppleEnvironment(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "sandbox") return "Sandbox";
  if (text === "production") return "Production";
  if (text === "xcode") return "Xcode";
  return "";
}

/**
 * @param {string} baseUrl
 * @returns {"Sandbox"|"Production"|""}
 */
function environmentForApiBase(baseUrl) {
  if (baseUrl === APP_STORE_API_SANDBOX) return "Sandbox";
  if (baseUrl === APP_STORE_API_PRODUCTION) return "Production";
  return "";
}

/**
 * Valida payload decodificado de signedTransactionInfo.
 * Bundle, produto, transação, assinatura original, ambiente e expiração são obrigatórios.
 * @param {Record<string, unknown>} payload
 * @param {string} expectedProductId
 * @param {{ expectedTransactionId?: string|null, allowedEnvironments?: string[], now?: number }} [options]
 * @returns {AppleSubscriptionVerification}
 */
export function validateAppleTransactionPayload(payload, expectedProductId, options = {}) {
  const bundleId = process.env.APPLE_IAP_BUNDLE_ID?.trim() || APPLE_BUNDLE_ID;
  const payloadBundleId = String(payload.bundleId ?? "").trim();
  const productId = String(payload.productId ?? "").trim();
  const transactionId = String(payload.transactionId ?? "").trim();
  const originalTransactionId = String(payload.originalTransactionId ?? "").trim();
  const environment = normalizeAppleEnvironment(payload.environment);
  const allowedEnvironments = options.allowedEnvironments?.length
    ? options.allowedEnvironments
    : ["Sandbox", "Production"];
  const expectedTransactionId = String(options.expectedTransactionId ?? "").trim();
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const revocationDate = payload.revocationDate ?? null;

  if (!payloadBundleId || payloadBundleId !== bundleId) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Compra não pertence a este app.",
    };
  }

  if (!productId || productId !== expectedProductId) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Produto da compra não corresponde à assinatura Premium.",
    };
  }

  if (!transactionId) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Transação da App Store incompleta.",
    };
  }

  if (expectedTransactionId && transactionId !== expectedTransactionId) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Transação da App Store não confere.",
    };
  }

  if (!originalTransactionId) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Assinatura original da App Store ausente.",
    };
  }

  if (!allowedEnvironments.includes(environment)) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Ambiente da compra não é aceito.",
    };
  }

  if (revocationDate) {
    return {
      valid: false,
      code: "PURCHASE_EXPIRED",
      message: "Assinatura revogada ou reembolsada.",
    };
  }

  const expiresMs = Number(payload.expiresDate);
  if (!Number.isFinite(expiresMs) || expiresMs <= 0) {
    return {
      valid: false,
      code: "PURCHASE_EXPIRED",
      message: "Assinatura sem data de expiração.",
    };
  }

  const expiresAt = new Date(expiresMs).toISOString();
  if (Date.parse(expiresAt) <= now) {
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
 * Valida o payload de um JWS já separado da assinatura.
 * Não prova autenticidade. Só o caminho com a flag local chama esta função.
 * @param {string} jwsRepresentation
 * @param {string} expectedProductId
 * @param {{ expectedTransactionId?: string|null, allowedEnvironments?: string[], now?: number }} [options]
 * @returns {AppleSubscriptionVerification}
 */
export function verifyAppleSubscriptionFromJws(jwsRepresentation, expectedProductId, options = {}) {
  const payload = decodeAppleJwsPayload(jwsRepresentation);
  if (!payload) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Recibo da compra inválido.",
    };
  }

  return validateAppleTransactionPayload(payload, expectedProductId, options);
}

/**
 * Valida transação Apple via App Store Server API (sandbox e, em seguida, produção).
 * @param {{ transactionId: string, productId: string, jwsRepresentation?: string|null }} params
 * @returns {Promise<AppleSubscriptionVerification>}
 */
export async function verifyAppleSubscription({
  transactionId,
  productId,
  jwsRepresentation = null,
}) {
  if (!transactionId || !productId) {
    return {
      valid: false,
      code: "VALIDATION",
      message: "Transação ou produto da compra ausente.",
    };
  }

  const token = createAppStoreServerJwt();
  let sawAuthError = false;
  let sawNotFound = false;

  if (token) {
    const useSandboxOnly = process.env.APPLE_IAP_USE_SANDBOX === "true";
    const bases = useSandboxOnly
      ? [APP_STORE_API_SANDBOX]
      : [APP_STORE_API_SANDBOX, APP_STORE_API_PRODUCTION];

    for (const baseUrl of bases) {
      const result = await fetchAppleTransaction(baseUrl, transactionId, token);

      if (result.status === 401 || result.status === 403) {
        sawAuthError = true;
        continue;
      }

      if (result.status === 404) {
        sawNotFound = true;
        continue;
      }

      if (result.ok) {
        return validateAppleTransactionPayload(result.payload ?? {}, productId, {
          expectedTransactionId: transactionId,
          allowedEnvironments: [environmentForApiBase(baseUrl)],
        });
      }
    }
  }

  const jws = typeof jwsRepresentation === "string" ? jwsRepresentation.trim() : "";
  if (jws && isUnverifiedAppleJwsAllowed()) {
    const fromJws = verifyAppleSubscriptionFromJws(jws, productId, {
      expectedTransactionId: transactionId,
      allowedEnvironments: ["Sandbox", "Production", "Xcode"],
    });
    if (fromJws.valid) return fromJws;
  }

  if (!token) {
    return {
      valid: false,
      code: "SERVER",
      message: "Verificação App Store não configurada no servidor.",
    };
  }

  if (sawAuthError) {
    return {
      valid: false,
      code: "SERVER",
      message:
        "Credenciais da App Store inválidas no servidor. Confira APPLE_IAP_ISSUER_ID, APPLE_IAP_KEY_ID e APPLE_IAP_PRIVATE_KEY na Vercel.",
    };
  }

  if (sawNotFound && !jws) {
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message:
        "Compra não encontrada na App Store. Se estiver testando com StoreKit local, reenvie a compra ou use conta Sandbox.",
    };
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
