import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";
import { ensurePerfil } from "@/lib/ensurePerfil";
import { registrarLog } from "@/lib/logs";
import { safeRedirectPath } from "@/lib/safeRedirectPath";

/** @type {boolean} */
let socialLoginReady = false;

const SHA1_HINT =
  "Se você selecionou a conta e mesmo assim falhou: no Google Cloud, crie outro cliente Android com o SHA-1 da Play Console (Release > Setup > App integrity > App signing key), além do SHA-1 do seu keystore de upload.";

/**
 * @returns {string}
 */
export function getGoogleWebClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";
}

/**
 * Login Google nativo disponível no app Capacitor com Web Client ID configurado.
 * @returns {boolean}
 */
export function canUseNativeGoogleSignIn() {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Boolean(getGoogleWebClientId())
  );
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
    return `Login cancelado. ${SHA1_HINT}`;
  }

  if (message) {
    if (/not implemented|plugin/i.test(message)) {
      return "Atualize o app na Play Store (versão 1.0.5 ou superior).";
    }
    if (/cancel/i.test(message)) {
      return `Login cancelado. ${SHA1_HINT}`;
    }
    if (/access token|authorization|SHA|audience|nonce|client/i.test(message)) {
      return `${message} ${SHA1_HINT}`;
    }
    return message;
  }

  return "Não foi possível concluir o login com Google.";
}

/**
 * @returns {Promise<void>}
 */
async function ensureNativeGoogleInitialized() {
  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    throw new Error(
      "Configure NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID na Vercel e faça redeploy."
    );
  }

  if (socialLoginReady) return;

  try {
    await SocialLogin.initialize({
      google: {
        webClientId,
        mode: "online",
      },
    });
  } catch (error) {
    console.error("SocialLogin.initialize:", error);
    throw new Error(formatNativeGoogleError(error));
  }

  socialLoginReady = true;
}

/**
 * @param {boolean} [retry=false]
 * @returns {Promise<import("@capgo/capacitor-social-login").GoogleLoginResponse>}
 */
async function loginWithGoogleNative(retry = false) {
  const rawNonce = getUrlSafeNonce();
  const nonceDigest = await sha256Hex(rawNonce);

  try {
    const response = await SocialLogin.login({
      provider: "google",
      options: {
        nonce: nonceDigest,
      },
    });

    if (response.provider !== "google") {
      throw new Error("Resposta inesperada do Google Sign-In.");
    }

    const { result } = response;
    if (result.responseType !== "online" || !result.idToken) {
      throw new Error("Token do Google indisponível. Verifique SHA-1 no Google Cloud.");
    }

    const webClientId = getGoogleWebClientId();
    const decoded = decodeJwtPayload(result.idToken);
    if (decoded?.aud && decoded.aud !== webClientId) {
      throw new Error(
        `Client ID inválido no token (${decoded.aud}). Confira Web Client ID na Vercel e no Supabase.`
      );
    }

    if (decoded?.nonce && decoded.nonce !== nonceDigest) {
      throw new Error("Nonce do token não confere. Tente novamente.");
    }

    return { result, rawNonce, decoded };
  } catch (error) {
    console.error("SocialLogin.login:", error);

    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code === "USER_CANCELLED") {
      throw error;
    }

    if (!retry) {
      try {
        await SocialLogin.logout({ provider: "google" });
      } catch (logoutError) {
        console.warn("SocialLogin.logout:", logoutError);
      }
      return loginWithGoogleNative(true);
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
    await ensureNativeGoogleInitialized();
  } catch (error) {
    return { error: new Error(formatNativeGoogleError(error)) };
  }

  let loginPayload;
  try {
    loginPayload = await loginWithGoogleNative();
  } catch (error) {
    return { error: new Error(formatNativeGoogleError(error)) };
  }

  const { result, rawNonce, decoded } = loginPayload;
  const signInOptions = {
    provider: "google",
    token: result.idToken,
  };

  if (decoded?.nonce) {
    signInOptions.nonce = rawNonce;
  }

  const { error } = await supabase.auth.signInWithIdToken(signInOptions);

  if (error) {
    console.error("signInWithIdToken:", error.message);
    return {
      error: new Error(
        error.message.includes("nonce")
          ? `Erro de nonce no Supabase. Confira o Web Client ID no painel. ${SHA1_HINT}`
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
