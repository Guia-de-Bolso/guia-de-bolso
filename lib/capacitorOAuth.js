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
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://app.guiadebolso.app";
    return `${origin}/auth/mobile-callback${nextQuery}`;
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
 * @param {string} url
 * @returns {URL}
 */
function parseOAuthCallbackUrl(url) {
  if (url.startsWith("app.guiadebolso://")) {
    return new URL(url.replace(/^app\.guiadebolso:\/\//, "https://app.guiadebolso.app/"));
  }
  return new URL(url);
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

    const parsed = parseOAuthCallbackUrl(url);
    const code = parsed.searchParams.get("code");
    const next = safeRedirectPath(parsed.searchParams.get("next"));
    const oauthError = parsed.searchParams.get("error");

    if (oauthError || !code) {
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
 * Abre a URL OAuth no ambiente atual.
 * @param {string} url
 * @param {() => void} [onDismissed]
 * @returns {Promise<boolean>} true se abriu em Custom Tab (aguarda retorno)
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
      console.warn("Browser.open falhou, usando fallback no WebView:", error);
    }
  }

  window.location.assign(url);
  return false;
}

/**
 * Inicia login Google — Custom Tab no app nativo; redirect explícito na web.
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
      error: new Error("Não foi possível iniciar o login com Google."),
      openedExternally: false,
    };
  }

  const openedExternally = await openOAuthUrl(data.url, onDismissed);
  return { error: null, openedExternally };
}
