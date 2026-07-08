import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";
import { ensurePerfil } from "@/lib/ensurePerfil";
import {
  decodeJwtPayload,
  getTokenAudience,
  isAcceptedGoogleTokenAudience,
} from "@/lib/googleIdToken";
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
export {
  decodeJwtPayload,
  getTokenAudience,
  isAcceptedGoogleTokenAudience,
} from "@/lib/googleIdToken";

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
export function getAcceptedGoogleTokenAudiences() {
  const webClientId = getGoogleWebClientId();
  if (Capacitor.getPlatform() === "ios") {
    const iOSClientId = getGoogleIOSClientId();
    return [webClientId, iOSClientId].filter(Boolean);
  }
  return webClientId ? [webClientId] : [];
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
    return "Login cancelado.";
  }

  if (message) {
    if (/not implemented|plugin/i.test(message)) {
      return "Atualize o app na loja para a versão mais recente.";
    }
    if (/cancel/i.test(message)) {
      return "Login cancelado.";
    }
    if (/access token|authorization|SHA|audience|nonce|client/i.test(message)) {
      return `${message} ${hint}`;
    }
    return message;
  }

  return "Não foi possível concluir o login com Google.";
}

/**
 * Google Sign-In nativo (Android/iOS) + sessão Supabase via ID token.
 * Uma tentativa apenas — retries que reabrem o seletor de conta causavam loop no Android.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null, cancelled?: boolean }>}
 */
export async function signInWithGoogleNative(supabase, postLoginPath = "/") {
  try {
    await ensureSocialLoginInitialized();
  } catch (error) {
    return { error: new Error(formatNativeGoogleError(error)) };
  }

  let result;

  try {
    // Sem nonce: no Credential Manager Android o nonce costumava gerar USER_CANCELLED
    // falso após escolher a conta; o retry sem nonce reabria o popup (loop).
    const response = await SocialLogin.login({
      provider: "google",
      options: {},
    });

    if (response.provider !== "google") {
      throw new Error("Resposta inesperada do Google Sign-In.");
    }

    result = response.result;
    if (result.responseType !== "online" || !result.idToken) {
      throw new Error("Token do Google indisponível após login.");
    }

    const decoded = decodeJwtPayload(result.idToken);
    const tokenAud = getTokenAudience(decoded);
    if (
      tokenAud &&
      !isAcceptedGoogleTokenAudience(tokenAud, getAcceptedGoogleTokenAudiences())
    ) {
      throw new Error(
        `Client ID inválido no token (${tokenAud}). Confira os Client IDs na Vercel e no Supabase.`
      );
    }
  } catch (error) {
    console.error("SocialLogin.login:", error);

    if (isUserCancelledError(error)) {
      return { error: null, cancelled: true };
    }

    return { error: new Error(formatNativeGoogleError(error)) };
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: result.idToken,
  });

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
