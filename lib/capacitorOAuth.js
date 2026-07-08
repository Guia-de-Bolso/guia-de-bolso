import { Capacitor } from "@capacitor/core";
import {
  APP_AUTH_ORIGIN,
  WEB_OAUTH_CALLBACK_PATH,
} from "@/lib/authOrigins";
import { signInWithGoogleDeepLink } from "@/lib/capacitorGoogleOAuthDeepLink";
import {
  canUseNativeAppleSignIn,
  signInWithAppleNative,
} from "@/lib/nativeAppleAuth";
import { canUseNativeGoogleSignIn, signInWithGoogleNative } from "@/lib/nativeGoogleAuth";
import { shouldUseIosNativeGoogleSignIn } from "@/lib/iosGoogleSignInMode";
import { safeRedirectPath } from "@/lib/safeRedirectPath";

export { NATIVE_OAUTH_CALLBACK } from "@/lib/authOrigins";

/**
 * @returns {boolean}
 */
export function isNativeCapacitorApp() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * @returns {boolean}
 */
export function isNativeIosApp() {
  return isNativeCapacitorApp() && Capacitor.getPlatform() === "ios";
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
 * OAuth Google via redirect no browser (somente web).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null, openedExternally: boolean }>}
 */
export async function signInWithGoogleWebOAuth(supabase, postLoginPath = "/") {
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
 * Login Google no app iOS: deep link OAuth (padrão) ou SDK nativo (env).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} postLoginPath
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null, openedExternally: boolean }>}
 */
async function signInWithGoogleOnIos(supabase, postLoginPath) {
  if (shouldUseIosNativeGoogleSignIn() && canUseNativeGoogleSignIn()) {
    const nativeResult = await signInWithGoogleNative(supabase, postLoginPath);
    if (!nativeResult.error) {
      return {
        error: null,
        cancelled: nativeResult.cancelled,
        openedExternally: false,
      };
    }
    console.warn("signInWithGoogleOnIos: native falhou, tentando deep link", nativeResult.error.message);
  }

  const deepLinkResult = await signInWithGoogleDeepLink(supabase, postLoginPath);
  return { ...deepLinkResult, openedExternally: true };
}

/**
 * Inicia login Google.
 * - iOS Capacitor: Browser in-app + deep link app.guiadebolso://auth/callback (build 1.0.10+).
 * - iOS com NEXT_PUBLIC_IOS_GOOGLE_NATIVE=true: tenta SDK nativo antes do deep link.
 * - Android Capacitor: Sign-In nativo + id_token.
 * - Web: OAuth redirect em /auth/callback.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null, openedExternally: boolean, cancelled?: boolean }>}
 */
export async function signInWithGoogleOAuth(supabase, postLoginPath = "/") {
  if (isNativeCapacitorApp()) {
    if (isNativeIosApp()) {
      return signInWithGoogleOnIos(supabase, postLoginPath);
    }

    if (!canUseNativeGoogleSignIn()) {
      return {
        error: new Error(
          "Google no app indisponível: configure NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID na Vercel."
        ),
        openedExternally: false,
      };
    }

    const { error, cancelled } = await signInWithGoogleNative(supabase, postLoginPath);
    return { error, cancelled, openedExternally: false };
  }

  return signInWithGoogleWebOAuth(supabase, postLoginPath);
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
