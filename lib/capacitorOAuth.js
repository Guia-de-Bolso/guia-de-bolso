import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import {
  APP_AUTH_ORIGIN,
  NATIVE_OAUTH_BRIDGE_PATH,
  NATIVE_OAUTH_CALLBACK,
  WEB_OAUTH_CALLBACK_PATH,
} from "@/lib/authOrigins";
import { ensurePerfil } from "@/lib/ensurePerfil";
import { registrarLog } from "@/lib/logs";
import { safeRedirectPath } from "@/lib/safeRedirectPath";
import { createClient } from "@/lib/supabase/client";

export { NATIVE_OAUTH_CALLBACK } from "@/lib/authOrigins";

/** @type {import("@capacitor/core").PluginListenerHandle | null} */
let appUrlListener = null;

/** @type {boolean} */
let handlingOAuthCallback = false;

/**
 * @returns {boolean}
 */
export function isNativeCapacitorApp() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * Monta redirectTo enviado ao Supabase.
 * No app nativo usa sempre app.guiadebolso.app (nunca o domínio de marketing).
 * @param {string} postLoginPath
 * @returns {string}
 */
export function buildOAuthRedirectUrl(postLoginPath = "/") {
  const next = safeRedirectPath(postLoginPath);
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  if (isNativeCapacitorApp()) {
    return `${APP_AUTH_ORIGIN}${NATIVE_OAUTH_BRIDGE_PATH}${nextQuery}`;
  }

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : APP_AUTH_ORIGIN;

  return `${origin}${WEB_OAUTH_CALLBACK_PATH}${nextQuery}`;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isOAuthCallbackUrl(url) {
  if (!url) return false;
  if (url.includes(NATIVE_OAUTH_BRIDGE_PATH)) return false;
  return (
    url.startsWith(NATIVE_OAUTH_CALLBACK) ||
    url.includes(WEB_OAUTH_CALLBACK_PATH)
  );
}

/**
 * @param {string} url
 * @returns {URL}
 */
function parseOAuthCallbackUrl(url) {
  if (url.startsWith("app.guiadebolso://")) {
    return new URL(url.replace(/^app\.guiadebolso:\/\//, `${APP_AUTH_ORIGIN}/`));
  }
  return new URL(url);
}

/**
 * @param {string} path
 * @returns {void}
 */
function navigateAfterLogin(path) {
  const target = safeRedirectPath(path);
  if (typeof window === "undefined") return;
  window.location.assign(target);
}

/**
 * Processa retorno OAuth no WebView do app (deep link ou App Link).
 * @param {string} url
 * @returns {Promise<void>}
 */
async function handleOAuthCallbackUrl(url) {
  if (!isOAuthCallbackUrl(url) || handlingOAuthCallback) return;

  handlingOAuthCallback = true;

  try {
    await Browser.close().catch(() => {});

    const parsed = parseOAuthCallbackUrl(url);
    const code = parsed.searchParams.get("code");
    const next = safeRedirectPath(parsed.searchParams.get("next"));
    const oauthError = parsed.searchParams.get("error");

    if (oauthError || !code) {
      navigateAfterLogin("/login?error=auth");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      navigateAfterLogin("/login?error=auth");
      return;
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("exchangeCodeForSession:", error.message);
      navigateAfterLogin("/login?error=auth");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await ensurePerfil(supabase, user);
      await registrarLog(supabase, user, "login", {
        provider: user.app_metadata?.provider,
      });
    }

    navigateAfterLogin(next);
  } finally {
    handlingOAuthCallback = false;
  }
}

/**
 * Registra listener de deep link OAuth (uma vez no shell nativo).
 * @returns {Promise<void>}
 */
export async function initCapacitorOAuthListener() {
  if (!isNativeCapacitorApp() || appUrlListener) return;

  appUrlListener = await App.addListener("appUrlOpen", (event) => {
    void handleOAuthCallbackUrl(event.url);
  });

  const launch = await App.getLaunchUrl();
  if (launch?.url) {
    void handleOAuthCallbackUrl(launch.url);
  }
}

/**
 * @param {string} url
 * @param {() => void} [onDismissed]
 * @returns {Promise<boolean>}
 */
async function openOAuthUrl(url, onDismissed) {
  if (isNativeCapacitorApp()) {
    try {
      await Browser.open({ url });
      if (onDismissed) {
        const handle = await Browser.addListener("browserFinished", () => {
          handle.remove();
          onDismissed();
        });
      }
      return true;
    } catch (error) {
      console.warn("Browser.open falhou, usando WebView:", error);
    }
  }

  window.location.assign(url);
  return false;
}

/**
 * Inicia login Google.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @param {{ onDismissed?: () => void }} [options]
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null, openedExternally: boolean }>}
 */
export async function signInWithGoogleOAuth(
  supabase,
  postLoginPath = "/",
  { onDismissed } = {}
) {
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
      error: new Error(
        "Não foi possível iniciar o login. Verifique as URLs de redirect no Supabase."
      ),
      openedExternally: false,
    };
  }

  const openedExternally = await openOAuthUrl(data.url, onDismissed);
  return { error: null, openedExternally };
}
