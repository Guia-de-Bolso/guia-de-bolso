import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { loadServiceAccountFromEnv } from "./serviceAccountEnv.js";

/** Limite do sendEachForMulticast (FCM). */
export const FCM_MULTICAST_LIMIT = 500;

/** Códigos que indicam token inválido/expirado. */
const INVALID_TOKEN_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
]);

/**
 * Carrega credenciais Firebase Admin (server-only).
 * @returns {object|null}
 */
export function loadFirebaseServiceAccount() {
  return loadServiceAccountFromEnv({ prefix: "FIREBASE" });
}

/**
 * @returns {import('firebase-admin/messaging').Messaging | null}
 */
export function getFirebaseMessagingClient() {
  const credentials = loadFirebaseServiceAccount();
  if (!credentials) return null;

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(credentials),
    });
  }

  return getMessaging();
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} size
 * @returns {T[][]}
 */
export function chunkArray(items, size) {
  if (!items.length) return [];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * @param {{
 *   tokens: string[],
 *   title: string,
 *   body: string,
 *   url?: string | null
 * }} params
 * @returns {Promise<{
 *   ok: boolean,
 *   sent: number,
 *   failed: number,
 *   invalidTokens: string[],
 *   errorCounts: Record<string, number>,
 *   code?: string,
 *   message?: string
 * }>}
 */
export async function sendPushNotificationBatch({ tokens, title, body, url = null }) {
  const messaging = getFirebaseMessagingClient();
  if (!messaging) {
    return {
      ok: false,
      sent: 0,
      failed: tokens.length,
      invalidTokens: [],
      errorCounts: {},
      code: "FIREBASE_NOT_CONFIGURED",
      message: "Firebase Admin não configurado no servidor.",
    };
  }

  if (!tokens.length) {
    return { ok: true, sent: 0, failed: 0, invalidTokens: [], errorCounts: {} };
  }

  const data = {};
  if (url) {
    data.url = url;
  }

  let sent = 0;
  let failed = 0;
  /** @type {string[]} */
  const invalidTokens = [];
  /** @type {Record<string, number>} */
  const errorCounts = {};

  for (const batch of chunkArray(tokens, FCM_MULTICAST_LIMIT)) {
    const response = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });

    sent += response.successCount;
    failed += response.failureCount;

    response.responses.forEach((result, index) => {
      if (result.success) return;
      const code = result.error?.code || "unknown";
      errorCounts[code] = (errorCounts[code] || 0) + 1;
      console.warn(
        `push send falhou (token ...${batch[index].slice(-8)}):`,
        code,
        result.error?.message || ""
      );
      if (INVALID_TOKEN_ERROR_CODES.has(code)) {
        invalidTokens.push(batch[index]);
      }
    });
  }

  return {
    ok: failed === 0,
    sent,
    failed,
    invalidTokens: [...new Set(invalidTokens)],
    errorCounts,
  };
}
