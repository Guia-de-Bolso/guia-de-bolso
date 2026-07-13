import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { loadServiceAccountFromEnv } from "./serviceAccountEnv.js";

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
      code: "FIREBASE_NOT_CONFIGURED",
      message: "Firebase Admin não configurado no servidor.",
    };
  }

  if (!tokens.length) {
    return { ok: true, sent: 0, failed: 0 };
  }

  const data = {};
  if (url) {
    data.url = url;
  }

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
    },
    data,
    android: {
      priority: "high",
      notification: {
        clickAction: "FCM_PLUGIN_ACTIVITY",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  });

  return {
    ok: response.failureCount === 0,
    sent: response.successCount,
    failed: response.failureCount,
  };
}
