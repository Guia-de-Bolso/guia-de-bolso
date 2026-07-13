"use client";

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  PUSH_DEVICE_TOKEN_STORAGE_KEY,
  PUSH_PREFERENCE_STORAGE_KEY,
} from "@/lib/pushNotificationConstants";
import { fetchApi } from "@/lib/fetchApi";
import { safeRedirectPath } from "@/lib/safeRedirectPath";
import { navigateAppPath } from "@/lib/capacitorNavigation";

/** @type {boolean} */
let listenersAttached = false;

/** @type {string | null} */
let pendingDeviceToken = null;

/**
 * @returns {boolean}
 */
export function isPushNotificationsAvailable() {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.isPluginAvailable("PushNotifications")
  );
}

/**
 * @returns {boolean}
 */
export function getPushNotificationsPreference() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PUSH_PREFERENCE_STORAGE_KEY) === "1";
}

/**
 * @param {boolean} enabled
 */
export function setPushNotificationsPreference(enabled) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUSH_PREFERENCE_STORAGE_KEY, enabled ? "1" : "0");
}

/**
 * @returns {string | null}
 */
export function getStoredPushDeviceToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PUSH_DEVICE_TOKEN_STORAGE_KEY);
}

/**
 * @param {string | null} token
 */
function storePushDeviceToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(PUSH_DEVICE_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(PUSH_DEVICE_TOKEN_STORAGE_KEY);
  }
}

/**
 * @param {string} token
 * @returns {Promise<boolean>}
 */
async function registerTokenOnServer(token) {
  const response = await fetchApi("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      platform: Capacitor.getPlatform(),
    }),
  });

  return response.ok;
}

/**
 * @param {string} [token]
 * @returns {Promise<void>}
 */
export async function unregisterPushTokenOnServer(token) {
  const deviceToken = token || getStoredPushDeviceToken();
  if (!deviceToken) return;

  await fetchApi("/api/push/register", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: deviceToken }),
  }).catch(() => {});
}

/**
 * @param {unknown} notification
 * @returns {string | null}
 */
export function getPushNotificationTargetPath(notification) {
  const data =
    notification && typeof notification === "object" && "data" in notification
      ? notification.data
      : null;

  if (!data || typeof data !== "object") return null;

  const url = "url" in data ? data.url : null;
  if (typeof url !== "string" || !url.trim()) return null;

  return safeRedirectPath(url.trim(), null);
}

/**
 * Garante listeners do plugin (idempotente).
 * @returns {void}
 */
export function ensurePushNotificationListeners() {
  if (!isPushNotificationsAvailable() || listenersAttached) return;

  listenersAttached = true;

  PushNotifications.addListener("registration", async (event) => {
    const token = event.value?.trim();
    if (!token) return;

    pendingDeviceToken = token;
    storePushDeviceToken(token);

    if (!getPushNotificationsPreference()) return;

    try {
      await registerTokenOnServer(token);
    } catch (error) {
      console.warn("push register:", error);
    }
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.warn("push registrationError:", error);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
    const path = getPushNotificationTargetPath(event.notification);
    if (path) {
      navigateAppPath(path);
    }
  });
}

/**
 * @returns {Promise<{ granted: boolean, reason?: string }>}
 */
export async function requestPushPermission() {
  if (!isPushNotificationsAvailable()) {
    return { granted: false, reason: "unavailable" };
  }

  ensurePushNotificationListeners();

  const status = await PushNotifications.checkPermissions();
  if (status.receive === "granted") {
    return { granted: true };
  }

  if (status.receive === "denied") {
    return { granted: false, reason: "denied" };
  }

  const requested = await PushNotifications.requestPermissions();
  return {
    granted: requested.receive === "granted",
    reason: requested.receive === "denied" ? "denied" : "prompt",
  };
}

/**
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function enablePushNotifications() {
  if (!isPushNotificationsAvailable()) {
    return { ok: false, reason: "unavailable" };
  }

  const permission = await requestPushPermission();
  if (!permission.granted) {
    return { ok: false, reason: permission.reason || "denied" };
  }

  setPushNotificationsPreference(true);
  ensurePushNotificationListeners();
  await PushNotifications.register();

  if (pendingDeviceToken) {
    const registered = await registerTokenOnServer(pendingDeviceToken);
    if (!registered) {
      return { ok: false, reason: "server" };
    }
  }

  return { ok: true };
}

/**
 * @returns {Promise<{ ok: boolean }>}
 */
export async function disablePushNotifications() {
  setPushNotificationsPreference(false);
  await unregisterPushTokenOnServer();
  return { ok: true };
}

/**
 * Reativa registro após login se o usuário já tinha opt-in.
 * @returns {Promise<void>}
 */
export async function syncPushNotificationsAfterLogin() {
  if (!isPushNotificationsAvailable() || !getPushNotificationsPreference()) {
    return;
  }

  const permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted") return;

  ensurePushNotificationListeners();
  await PushNotifications.register();

  const token = pendingDeviceToken || getStoredPushDeviceToken();
  if (token) {
    await registerTokenOnServer(token);
  }
}

/**
 * Remove token ao sair da conta.
 * @returns {Promise<void>}
 */
export async function clearPushNotificationsOnLogout() {
  await unregisterPushTokenOnServer();
  pendingDeviceToken = null;
}
