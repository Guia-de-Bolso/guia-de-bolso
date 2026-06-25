import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";

/** @type {boolean} */
let socialLoginReady = false;

/** @type {Promise<void> | null} */
let initPromise = null;

/** Bundle ID — clientId exigido pelo plugin Apple no iOS. */
export const APPLE_NATIVE_CLIENT_ID = "app.guiadebolso";

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isUserCancelledError(error) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "";
  return code === "USER_CANCELLED" || /cancel/i.test(message);
}

/**
 * @returns {string}
 */
export function getGoogleWebClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";
}

/**
 * @returns {string}
 */
export function getGoogleIOSClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || "";
}

/**
 * URL scheme (reversed client ID) para Info.plist a partir do iOS Client ID.
 * @param {string} [iOSClientId]
 * @returns {string}
 */
export function getGoogleIOSUrlScheme(iOSClientId = getGoogleIOSClientId()) {
  const suffix = ".apps.googleusercontent.com";
  if (!iOSClientId || !iOSClientId.endsWith(suffix)) return "";
  const clientPart = iOSClientId.slice(0, -suffix.length);
  return `com.googleusercontent.apps.${clientPart}`;
}

/**
 * @returns {boolean}
 */
export function isNativeIOS() {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "ios"
  );
}

/**
 * @returns {boolean}
 */
export function isNativeAndroid() {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}

/**
 * Opções de initialize para a plataforma atual.
 * @returns {import("@capgo/capacitor-social-login").InitializeOptions}
 */
export function buildSocialLoginInitOptions() {
  /** @type {import("@capgo/capacitor-social-login").InitializeOptions} */
  const options = {};
  const webClientId = getGoogleWebClientId();

  if (isNativeAndroid() && webClientId) {
    options.google = {
      webClientId,
      mode: "online",
    };
  }

  if (isNativeIOS()) {
    const iOSClientId = getGoogleIOSClientId();
    if (iOSClientId && webClientId) {
      options.google = {
        iOSClientId,
        iOSServerClientId: webClientId,
        mode: "online",
      };
    }

    options.apple = {
      clientId: APPLE_NATIVE_CLIENT_ID,
    };
  }

  return options;
}

/**
 * @returns {Promise<void>}
 */
export async function ensureSocialLoginInitialized() {
  if (socialLoginReady) return;
  if (initPromise) return initPromise;

  const options = buildSocialLoginInitOptions();
  if (Object.keys(options).length === 0) {
    throw new Error("Login social nativo indisponível neste dispositivo.");
  }

  initPromise = SocialLogin.initialize(options)
    .then(() => {
      socialLoginReady = true;
    })
    .catch((error) => {
      initPromise = null;
      throw error;
    });

  return initPromise;
}
