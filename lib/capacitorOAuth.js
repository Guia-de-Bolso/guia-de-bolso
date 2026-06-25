import { Capacitor } from "@capacitor/core";
import {
  APP_AUTH_ORIGIN,
  WEB_OAUTH_CALLBACK_PATH,
} from "@/lib/authOrigins";
import {
  canUseNativeAppleSignIn,
  signInWithAppleNative,
} from "@/lib/nativeAppleAuth";
import { canUseNativeGoogleSignIn, signInWithGoogleNative } from "@/lib/nativeGoogleAuth";
import { safeRedirectPath } from "@/lib/safeRedirectPath";

export { NATIVE_OAUTH_CALLBACK } from "@/lib/authOrigins";

/**
 * @returns {boolean}
 */
export function isNativeCapacitorApp() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * Monta redirectTo para OAuth web (browser).
 * @param {string} postLoginPath
 * @returns {string}
 */
export function buildOAuthRedirectUrl(postLoginPath = "/") {
  const next = safeRedirectPath(postLoginPath);
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : APP_AUTH_ORIGIN;

  return `${origin}${WEB_OAUTH_CALLBACK_PATH}${nextQuery}`;
}

/**
 * Inicia login Google.
 * - App nativo: Google Sign-In nativo + signInWithIdToken (sem browser).
 * - Web: OAuth redirect clássico via Supabase.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null, openedExternally: boolean }>}
 */
export async function signInWithGoogleOAuth(supabase, postLoginPath = "/") {
  if (isNativeCapacitorApp()) {
    if (!canUseNativeGoogleSignIn()) {
      const missingIosClient =
        isNativeCapacitorApp() &&
        typeof window !== "undefined" &&
        Capacitor.getPlatform() === "ios";
      return {
        error: new Error(
          missingIosClient
            ? "Google no app iOS indisponível: configure NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID e NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID na Vercel."
            : "Google no app indisponível: configure NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID na Vercel."
        ),
        openedExternally: false,
      };
    }

    const { error } = await signInWithGoogleNative(supabase, postLoginPath);
    return { error, openedExternally: false };
  }

  const redirectTo = buildOAuthRedirectUrl(postLoginPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error, openedExternally: false };
  }

  if (!data?.url) {
    return {
      error: new Error("Não foi possível iniciar o login com Google."),
      openedExternally: false,
    };
  }

  window.location.assign(data.url);
  return { error: null, openedExternally: false };
}

/**
 * Inicia login Apple (somente app iOS nativo).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null, cancelled?: boolean }>}
 */
export async function signInWithAppleAuth(supabase, postLoginPath = "/") {
  if (!canUseNativeAppleSignIn()) {
    return {
      error: new Error("Sign in with Apple disponível apenas no app iOS."),
    };
  }

  return signInWithAppleNative(supabase, postLoginPath);
}
