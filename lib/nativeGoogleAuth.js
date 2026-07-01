import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";
import { ensurePerfil } from "@/lib/ensurePerfil";
import { registrarLog } from "@/lib/logs";
import {
  ensureSocialLoginInitialized,
  getGoogleIOSClientId,
  getGoogleWebClientId,
  isUserCancelledError,
} from "@/lib/nativeSocialLoginInit";
import { safeRedirectPath } from "@/lib/safeRedirectPath";

const ANDROID_SHA1_HINT =
  "Confira também: package `app.guiadebolso` no cliente Android OAuth, Web Client ID na Vercel (não o ID Android) e seu e-mail em Usuários de teste na tela de consentimento OAuth.";

const IOS_GOOGLE_HINT =
  "Confira: iOS OAuth Client (bundle app.guiadebolso), URL scheme no Info.plist (reversed client ID) e NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID na Vercel.";

/**
 * @returns {string}
 */
function getPlatformGoogleHint() {
  return Capacitor.getPlatform() === "ios" ? IOS_GOOGLE_HINT : ANDROID_SHA1_HINT;
}

export { getGoogleWebClientId, getGoogleIOSClientId } from "@/lib/nativeSocialLoginInit";

/**
 * Login Google nativo disponível no app Capacitor com client IDs configurados.
 * @returns {boolean}
 */
export function canUseNativeGoogleSignIn() {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return false;
  }

  const webClientId = getGoogleWebClientId();
  if (!webClientId) return false;

  if (Capacitor.getPlatform() === "ios") {
    return Boolean(getGoogleIOSClientId());
  }

  return true;
}

/**
 * Client IDs aceitos no claim `aud` do id_token (por plataforma).
 * iOS com iOSServerClientId costuma emitir aud = Web Client ID, não o iOS Client ID.
 * @returns {string[]}
 */
function getAcceptedGoogleTokenAudiences() {
  const webClientId = getGoogleWebClientId();
  if (Capacitor.getPlatform() === "ios") {
    const iOSClientId = getGoogleIOSClientId();
    return [webClientId, iOSClientId].filter(Boolean);
  }
  return webClientId ? [webClientId] : [];
}

/**
 * @param {unknown} audience
 * @returns {boolean}
 */
function isAcceptedGoogleTokenAudience(audience) {
  if (typeof audience !== "string" || !audience) return false;
  return getAcceptedGoogleTokenAudiences().includes(audience);
}

/**
 * @returns {string}
 */
function getUrlSafeNonce() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * @param {string} value
 * @returns {Promise<string>}
 */
async function sha256Hex(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * @param {string} token
 * @returns {Record<string, unknown> | null}
 */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function formatNativeGoogleError(error) {
  const hint = getPlatformGoogleHint();
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

  if (code === "USER_CANCELLED") {
    return `Login cancelado. ${hint}`;
  }

  if (message) {
    if (/not implemented|plugin/i.test(message)) {
      return "Atualize o app na loja para a versão mais recente.";
    }
    if (/cancel/i.test(message)) {
      return `Login cancelado. ${hint}`;
    }
    if (/access token|authorization|SHA|audience|nonce|client/i.test(message)) {
      return `${message} ${hint}`;
    }
    return message;
  }

  return "Não foi possível concluir o login com Google.";
}

/**
 * @param {boolean} [useNonce=true]
 * @returns {Promise<{ loginOptions: Record<string, unknown>, rawNonce?: string, nonceDigest?: string }>}
 */
async function buildGoogleLoginOptions(useNonce = true) {
  if (!useNonce) {
    return { loginOptions: {} };
  }

  const rawNonce = getUrlSafeNonce();
  const nonceDigest = await sha256Hex(rawNonce);
  return {
    loginOptions: {
      nonce: nonceDigest,
    },
    rawNonce,
    nonceDigest,
  };
}

/**
 * @param {boolean} [retry=false]
 * @param {boolean} [useNonce=true]
 * @returns {Promise<{ result: import("@capgo/capacitor-social-login").GoogleLoginResponseOnline, rawNonce?: string, decoded: Record<string, unknown> | null, usedNonce: boolean }>}
 */
async function loginWithGoogleNative(retry = false, useNonce = true) {
  const { loginOptions, rawNonce, nonceDigest } = await buildGoogleLoginOptions(useNonce);

  try {
    const response = await SocialLogin.login({
      provider: "google",
      options: loginOptions,
    });

    if (response.provider !== "google") {
      throw new Error("Resposta inesperada do Google Sign-In.");
    }

    const { result } = response;
    if (result.responseType !== "online" || !result.idToken) {
      throw new Error("Token do Google indisponível após login.");
    }

    const decoded = decodeJwtPayload(result.idToken);
    const tokenAud =
      typeof decoded?.aud === "string"
        ? decoded.aud
        : Array.isArray(decoded?.aud)
          ? decoded.aud.find((value) => typeof value === "string")
          : "";
    if (tokenAud && !isAcceptedGoogleTokenAudience(tokenAud)) {
      throw new Error(
        `Client ID inválido no token (${tokenAud}). Confira os Client IDs na Vercel e no Supabase.`
      );
    }

    if (useNonce && nonceDigest && decoded?.nonce && decoded.nonce !== nonceDigest) {
      throw new Error("Nonce do token não confere. Tente novamente.");
    }

    return { result, rawNonce, decoded, usedNonce: useNonce };
  } catch (error) {
    console.error("SocialLogin.login:", { retry, useNonce, error });

    if (isUserCancelledError(error) && useNonce) {
      try {
        await SocialLogin.logout({ provider: "google" });
      } catch (logoutError) {
        console.warn("SocialLogin.logout:", logoutError);
      }
      return loginWithGoogleNative(false, false);
    }

    if (!retry) {
      try {
        await SocialLogin.logout({ provider: "google" });
      } catch (logoutError) {
        console.warn("SocialLogin.logout:", logoutError);
      }
      return loginWithGoogleNative(true, useNonce);
    }

    throw error;
  }
}

/**
 * Google Sign-In nativo (Android/iOS) + sessão Supabase via ID token.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null }>}
 */
export async function signInWithGoogleNative(supabase, postLoginPath = "/") {
  try {
    await ensureSocialLoginInitialized();
  } catch (error) {
    return { error: new Error(formatNativeGoogleError(error)) };
  }

  let loginPayload;
  try {
    loginPayload = await loginWithGoogleNative();
  } catch (error) {
    return { error: new Error(formatNativeGoogleError(error)) };
  }

  const { result, rawNonce, decoded, usedNonce } = loginPayload;
  const signInOptions = {
    provider: "google",
    token: result.idToken,
  };

  if (usedNonce && decoded?.nonce && rawNonce) {
    signInOptions.nonce = rawNonce;
  }

  const { error } = await supabase.auth.signInWithIdToken(signInOptions);

  if (error) {
    console.error("signInWithIdToken:", error.message);
    return {
      error: new Error(
        error.message.includes("nonce")
          ? `Erro de nonce no Supabase. Confira o Web Client ID no painel. ${getPlatformGoogleHint()}`
          : formatNativeGoogleError(error)
      ),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensurePerfil(supabase, user);
    await registrarLog(supabase, user, "login", {
      provider: "google",
    });
  }

  const next = safeRedirectPath(postLoginPath);
  if (typeof window !== "undefined") {
    window.location.assign(next);
  }

  return { error: null };
}
