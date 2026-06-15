import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { ensurePerfil } from "@/lib/ensurePerfil";
import { registrarLog } from "@/lib/logs";
import { safeRedirectPath } from "@/lib/safeRedirectPath";
import { createClient } from "@/lib/supabase/client";

/** Deep link de retorno OAuth no app Android (cadastrar no Supabase Auth). */
export const NATIVE_OAUTH_CALLBACK = "app.guiadebolso://auth/callback";

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
 * Monta a URL de redirect pós-OAuth conforme o ambiente.
 * @param {string} postLoginPath
 * @returns {string}
 */
export function buildOAuthRedirectUrl(postLoginPath = "/") {
  const next = safeRedirectPath(postLoginPath);
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  if (isNativeCapacitorApp()) {
    return `${NATIVE_OAUTH_CALLBACK}${nextQuery}`;
  }

  return `${window.location.origin}/auth/callback${nextQuery}`;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isOAuthCallbackUrl(url) {
  if (!url) return false;
  return (
    url.startsWith(`${NATIVE_OAUTH_CALLBACK}`) ||
    url.includes("/auth/callback")
  );
}

/**
 * Processa o retorno OAuth no app nativo (deep link).
 * @param {string} url
 * @returns {Promise<void>}
 */
async function handleOAuthCallbackUrl(url) {
  if (!isOAuthCallbackUrl(url) || handlingOAuthCallback) return;

  handlingOAuthCallback = true;

  try {
    await Browser.close().catch(() => {});

    const parsed = new URL(url.replace(/^app\.guiadebolso:\/\//, "https://app.guiadebolso.app/"));
    const code = parsed.searchParams.get("code");
    const next = safeRedirectPath(parsed.searchParams.get("next"));

    if (!code) {
      window.location.assign("/login?error=auth");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      window.location.assign("/login?error=auth");
      return;
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      window.location.assign("/login?error=auth");
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

    window.location.assign(next);
  } finally {
    handlingOAuthCallback = false;
  }
}

/**
 * Registra listener de deep link OAuth (chamar uma vez no shell nativo).
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
 * Inicia login Google — abre Custom Tab no app nativo; redirect web no browser.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @returns {Promise<{ error: import("@supabase/supabase-js").AuthError | null }>}
 */
export async function signInWithGoogleOAuth(supabase, postLoginPath = "/") {
  const redirectTo = buildOAuthRedirectUrl(postLoginPath);

  if (!isNativeCapacitorApp()) {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return { error: error ?? null };
  }

  await Browser.open({ url: data.url, presentationStyle: "popover" });
  return { error: null };
}
