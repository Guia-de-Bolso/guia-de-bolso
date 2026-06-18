import { GoogleAuth } from "google-auth-library";
import { GOOGLE_PLAY_PACKAGE_NAME } from "@/lib/playPremiumConfig";

const ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";

/** Estados de assinatura considerados ativos para liberar Premium. */
const ACTIVE_SUBSCRIPTION_STATES = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
]);

/**
 * @typedef {Object} PlaySubscriptionVerification
 * @property {boolean} valid
 * @property {string} [code]
 * @property {string} [message]
 * @property {string} [purchaseToken]
 * @property {string} [productId]
 * @property {string|null} [expiresAt] - ISO 8601
 * @property {string|null} [orderId]
 */

/**
 * Carrega credenciais da service account do Google Play (server-only).
 * @returns {object|null}
 */
function loadServiceAccountCredentials() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Obtém access token para Android Publisher API.
 * @returns {Promise<string|null>}
 */
async function getAndroidPublisherAccessToken() {
  const credentials = loadServiceAccountCredentials();
  if (!credentials) return null;

  const auth = new GoogleAuth({
    credentials,
    scopes: [ANDROID_PUBLISHER_SCOPE],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse?.token ?? null;
}

/**
 * Valida assinatura Google Play via purchases.subscriptionsv2.get.
 * @param {{ purchaseToken: string, productId: string }} params
 * @returns {Promise<PlaySubscriptionVerification>}
 */
export async function verifyPlaySubscription({ purchaseToken, productId }) {
  if (!purchaseToken || !productId) {
    return {
      valid: false,
      code: "VALIDATION",
      message: "Token ou produto da compra ausente.",
    };
  }

  const accessToken = await getAndroidPublisherAccessToken();
  if (!accessToken) {
    return {
      valid: false,
      code: "SERVER",
      message: "Verificação Play não configurada no servidor.",
    };
  }

  const packageName =
    process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || GOOGLE_PLAY_PACKAGE_NAME;

  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    return {
      valid: false,
      code: "SERVER",
      message: "Não foi possível contactar o Google Play.",
    };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("verifyPlaySubscription Google API:", response.status, detail.slice(0, 300));
    return {
      valid: false,
      code: "PURCHASE_INVALID",
      message: "Não foi possível validar a compra na Play Store.",
    };
  }

  /** @type {Record<string, unknown>} */
  const payload = await response.json();
  const subscriptionState = String(payload.subscriptionState ?? "");

  if (!ACTIVE_SUBSCRIPTION_STATES.has(subscriptionState)) {
    return {
      valid: false,
      code: "PURCHASE_EXPIRED",
      message: "Assinatura inativa ou expirada.",
    };
  }

  const lineItems = Array.isArray(payload.lineItems) ? payload.lineItems : [];
  const matchingLine = lineItems.find((item) => {
    const lineProductId = String(item?.productId ?? "");
    return lineProductId === productId;
  });

  if (!matchingLine && lineItems.length > 0) {
    const knownIds = lineItems.map((item) => item?.productId).filter(Boolean);
    if (!knownIds.includes(productId)) {
      return {
        valid: false,
        code: "PURCHASE_INVALID",
        message: "Produto da compra não corresponde à assinatura Premium.",
      };
    }
  }

  const expiryRaw = matchingLine?.expiryTime ?? lineItems[0]?.expiryTime ?? null;
  const expiresAt =
    typeof expiryRaw === "string" && expiryRaw.trim() ? expiryRaw.trim() : null;

  return {
    valid: true,
    purchaseToken,
    productId,
    expiresAt,
    orderId: typeof payload.latestOrderId === "string" ? payload.latestOrderId : null,
  };
}

/**
 * Indica se a verificação server-side está configurada.
 * @returns {boolean}
 */
export function isPlayBillingVerifyConfigured() {
  return Boolean(loadServiceAccountCredentials());
}
