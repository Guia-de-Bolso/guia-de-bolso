import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";
import { ensurePerfil } from "@/lib/ensurePerfil";
import { registrarLog } from "@/lib/logs";
import { safeRedirectPath } from "@/lib/safeRedirectPath";

/** @type {boolean} */
let socialLoginReady = false;

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
 * @param {unknown} error
 * @returns {string}
 */
export function formatNativeGoogleError(error) {
  if (error instanceof Error) {
    if (/cancel/i.test(error.message)) return "Login cancelado.";
    if (/not implemented|plugin/i.test(error.message)) {
      return "Atualize o app na Play Store (versão 1.0.4 ou superior).";
    }
    return error.message;
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

  const rawNonce = crypto.randomUUID();
  const nonceDigest = await sha256Hex(rawNonce);

  let response;
  try {
    response = await SocialLogin.login({
      provider: "google",
      options: {
        scopes: ["email", "profile"],
        nonce: nonceDigest,
      },
    });
  } catch (error) {
    console.error("SocialLogin.login:", error);
    return { error: new Error(formatNativeGoogleError(error)) };
  }

  if (response.provider !== "google") {
    return { error: new Error("Resposta inesperada do Google Sign-In.") };
  }

  const { result } = response;
  if (result.responseType !== "online" || !result.idToken) {
    return { error: new Error("Token do Google indisponível. Verifique SHA-1 no Google Cloud.") };
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: result.idToken,
    nonce: rawNonce,
  });

  if (error) {
    console.error("signInWithIdToken:", error.message);
    return {
      error: new Error(
        error.message.includes("nonce")
          ? "Erro de nonce no Supabase. Confira Client ID/Secret do Google no painel."
          : error.message
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
