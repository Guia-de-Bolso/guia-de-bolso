import { SocialLogin } from "@capgo/capacitor-social-login";
import { ensurePerfil } from "@/lib/ensurePerfil";
import { registrarLog } from "@/lib/logs";
import {
  ensureSocialLoginInitialized,
  isNativeIOS,
  isUserCancelledError,
} from "@/lib/nativeSocialLoginInit";
import { safeRedirectPath } from "@/lib/safeRedirectPath";

/**
 * Apple Sign-In nativo disponível somente no app iOS (Capacitor).
 * @returns {boolean}
 */
export function canUseNativeAppleSignIn() {
  return isNativeIOS();
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function formatNativeAppleError(error) {
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

  if (code === "USER_CANCELLED" || /cancel/i.test(message)) {
    return "Login cancelado.";
  }

  if (message) {
    if (/not implemented|plugin/i.test(message)) {
      return "Atualize o app na App Store para usar Sign in with Apple.";
    }
    return message;
  }

  return "Não foi possível concluir o login com Apple.";
}

/**
 * Apple Sign-In nativo (iOS) + sessão Supabase via ID token.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null, cancelled?: boolean }>}
 */
export async function signInWithAppleNative(supabase, postLoginPath = "/") {
  try {
    await ensureSocialLoginInitialized();
  } catch (error) {
    return { error: new Error(formatNativeAppleError(error)) };
  }

  try {
    const response = await SocialLogin.login({
      provider: "apple",
      options: {
        scopes: ["email", "name"],
      },
    });

    if (response.provider !== "apple") {
      throw new Error("Resposta inesperada do Apple Sign-In.");
    }

    const { result } = response;
    if (!result.idToken) {
      throw new Error("Token da Apple indisponível após login.");
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: result.idToken,
    });

    if (error) {
      console.error("signInWithIdToken (apple):", error.message);
      return { error: new Error(formatNativeAppleError(error)) };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await ensurePerfil(supabase, user);
      await registrarLog(supabase, user, "login", {
        provider: "apple",
      });
    }

    const next = safeRedirectPath(postLoginPath);
    if (typeof window !== "undefined") {
      window.location.assign(next);
    }

    return { error: null };
  } catch (error) {
    console.error("SocialLogin.login (apple):", error);

    if (isUserCancelledError(error)) {
      return { error: null, cancelled: true };
    }

    return { error: new Error(formatNativeAppleError(error)) };
  }
}
