"use client";

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  PUSH_DEVICE_TOKEN_STORAGE_KEY,
  PUSH_PREFERENCE_STORAGE_KEY,
} from "@/lib/pushNotificationConstants";
import { fetchApi } from "@/lib/fetchApi";
import { toCapacitorStaticHref } from "@/lib/capacitorNavigation";
import {
  PUSH_COLD_START_WAIT_MS,
  PUSH_LAUNCH_CHECK_STORAGE_KEY,
  PUSH_NAVIGATE_EVENT,
  getPushNotificationTargetPath,
  isSamePushAppPath,
  shouldSkipPushLaunchWait,
} from "@/lib/pushNotificationOpen";

export {
  getPushNotificationTargetPath,
  isSamePushAppPath,
} from "@/lib/pushNotificationOpen";

/** @type {boolean} */
let listenersAttached = false;

/** @type {string | null} */
let pendingDeviceToken = null;

/** @type {Array<(token: string) => void>} */
let tokenWaiters = [];

/**
 * Depois do boot: taps em push navegam na hora (app quente / background).
 * Antes: só registram o path para o cold-start consumir sem flash da home.
 * @type {boolean}
 */
let pushLaunchGateOpen = false;

/** @type {string | null} */
let pendingLaunchPath = null;

/** @type {Array<(path: string | null) => void>} */
let launchPathWaiters = [];

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
 * Preferência local: ligada por padrão. Só fica off se o usuário desligar
 * explicitamente (`"0"`). Ausência da chave = quer receber push.
 * @returns {boolean}
 */
export function getPushNotificationsPreference() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PUSH_PREFERENCE_STORAGE_KEY) !== "0";
}

/**
 * Usuário desligou o toggle de propósito.
 * @returns {boolean}
 */
export function isPushNotificationsOptedOut() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PUSH_PREFERENCE_STORAGE_KEY) === "0";
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
 */
function rememberDeviceToken(token) {
  pendingDeviceToken = token;
  storePushDeviceToken(token);
  const waiters = tokenWaiters;
  tokenWaiters = [];
  for (const resolve of waiters) {
    resolve(token);
  }
}

/**
 * @param {number} [timeoutMs]
 * @returns {Promise<string | null>}
 */
function waitForDeviceToken(timeoutMs = 15000) {
  if (pendingDeviceToken) return Promise.resolve(pendingDeviceToken);

  return new Promise((resolve) => {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;

    /** @param {string} token */
    const onToken = (token) => {
      if (timer) clearTimeout(timer);
      resolve(token);
    };

    tokenWaiters.push(onToken);
    timer = setTimeout(() => {
      tokenWaiters = tokenWaiters.filter((waiter) => waiter !== onToken);
      resolve(pendingDeviceToken);
    }, timeoutMs);
  });
}

/**
 * @param {string} token
 * @returns {Promise<boolean>}
 */
async function registerTokenOnServer(token) {
  if (!getPushNotificationsPreference()) return false;

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
 * @returns {Promise<boolean>}
 */
export async function unregisterPushTokenOnServer(token) {
  const deviceToken = token || getStoredPushDeviceToken();
  if (!deviceToken) return true;

  try {
    const response = await fetchApi("/api/push/register", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: deviceToken }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * @returns {string | null}
 */
function readLaunchCheckTimestamp() {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(PUSH_LAUNCH_CHECK_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * @returns {void}
 */
export function markPushLaunchCheckDone() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PUSH_LAUNCH_CHECK_STORAGE_KEY, String(Date.now()));
  } catch {
    /* sessionStorage indisponível */
  }
}

/**
 * Libera navegação imediata para taps com o app já aberto.
 * @returns {void}
 */
export function openPushLaunchGate() {
  pushLaunchGateOpen = true;
}

/**
 * @param {string} path
 * @returns {void}
 */
function rememberLaunchPath(path) {
  pendingLaunchPath = path;
  const waiters = launchPathWaiters;
  launchPathWaiters = [];
  for (const resolve of waiters) {
    resolve(path);
  }
}

/**
 * Aguarda o evento de tap que abriu o app (cold start), ou timeout.
 * @param {number} [timeoutMs]
 * @returns {Promise<string | null>}
 */
export function waitForPushNotificationLaunchPath(
  timeoutMs = PUSH_COLD_START_WAIT_MS
) {
  if (pendingLaunchPath) return Promise.resolve(pendingLaunchPath);

  return new Promise((resolve) => {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;

    /** @param {string | null} path */
    const onPath = (path) => {
      if (timer) clearTimeout(timer);
      resolve(path);
    };

    launchPathWaiters.push(onPath);
    timer = setTimeout(() => {
      launchPathWaiters = launchPathWaiters.filter((waiter) => waiter !== onPath);
      resolve(pendingLaunchPath);
    }, timeoutMs);
  });
}

/**
 * Cold start: escuta push cedo, espera path do tap, evita flash da home.
 * @param {number} [timeoutMs]
 * @returns {Promise<string | null>}
 */
export async function resolvePushNotificationColdStart(
  timeoutMs = PUSH_COLD_START_WAIT_MS
) {
  if (!isPushNotificationsAvailable()) {
    openPushLaunchGate();
    return null;
  }

  ensurePushNotificationListeners();

  if (shouldSkipPushLaunchWait(Date.now(), readLaunchCheckTimestamp())) {
    openPushLaunchGate();
    return null;
  }

  const path = await waitForPushNotificationLaunchPath(timeoutMs);
  markPushLaunchCheckDone();
  openPushLaunchGate();
  return path;
}

/**
 * Abre path interno a partir do tap na notificação.
 * Prefere soft-nav (evento) para não recarregar o WebView remoto.
 * @param {string} path
 * @param {{ forceHard?: boolean }} [options]
 */
export function openPushNotificationPath(path, options = {}) {
  if (typeof window === "undefined") return;

  const { forceHard = false } = options;
  const href = toCapacitorStaticHref(path);
  const current = `${window.location.pathname || "/"}${window.location.search || ""}`;

  if (isSamePushAppPath(current, href)) return;

  if (!forceHard) {
    const event = new CustomEvent(PUSH_NAVIGATE_EVENT, {
      detail: { path: href },
      cancelable: true,
    });
    window.dispatchEvent(event);
    if (event.defaultPrevented) return;
  }

  markPushLaunchCheckDone();
  window.location.replace(href);
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

    rememberDeviceToken(token);

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
    if (!path) return;

    rememberLaunchPath(path);

    if (pushLaunchGateOpen) {
      openPushNotificationPath(path);
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

  const token =
    pendingDeviceToken ||
    getStoredPushDeviceToken() ||
    (await waitForDeviceToken());

  if (!token) {
    setPushNotificationsPreference(false);
    return { ok: false, reason: "token" };
  }

  const registered = await registerTokenOnServer(token);
  if (!registered) {
    setPushNotificationsPreference(false);
    return { ok: false, reason: "server" };
  }

  return { ok: true };
}

/**
 * @returns {Promise<{ ok: boolean }>}
 */
export async function disablePushNotifications() {
  setPushNotificationsPreference(false);
  const disabled = await unregisterPushTokenOnServer();

  try {
    await PushNotifications.unregister();
  } catch {
    /* unregister nativo opcional */
  }

  return { ok: disabled };
}

/**
 * Após login: push ligado por padrão. Só pula se o usuário desligou no perfil.
 * Pede permissão do SO (na 1ª vez) e registra o token.
 * @returns {Promise<void>}
 */
export async function syncPushNotificationsAfterLogin() {
  if (!isPushNotificationsAvailable() || isPushNotificationsOptedOut()) {
    return;
  }

  await enablePushNotifications();
}

/**
 * Remove token ao sair da conta.
 * @returns {Promise<void>}
 */
export async function clearPushNotificationsOnLogout() {
  await unregisterPushTokenOnServer();
  pendingDeviceToken = null;
}
