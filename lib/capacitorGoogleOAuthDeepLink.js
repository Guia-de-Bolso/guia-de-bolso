import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { ensurePerfil } from "@/lib/ensurePerfil";
import {
  buildNativeOAuthRedirectUrl,
  parseNativeOAuthCallbackUrl,
} from "@/lib/capacitorOAuthUrls";
import { registrarLog } from "@/lib/logs";
import { safeRedirectPath } from "@/lib/safeRedirectPath";

/** Tempo máximo aguardando o usuário concluir OAuth no browser in-app. */
export const GOOGLE_DEEP_LINK_OAUTH_TIMEOUT_MS = 120_000;

export { buildNativeOAuthRedirectUrl, parseNativeOAuthCallbackUrl } from "@/lib/capacitorOAuthUrls";

/**
 * Google OAuth no iOS/Android via SFSafariViewController/Custom Tab + deep link.
 * O PKCE fica no WebView; o callback volta com app.guiadebolso://auth/callback.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} [postLoginPath='/']
 * @returns {Promise<{ error: Error | import("@supabase/supabase-js").AuthError | null }>}
 */
export async function signInWithGoogleDeepLink(supabase, postLoginPath = "/") {
  const redirectTo = buildNativeOAuthRedirectUrl(postLoginPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error };
  }

  if (!data?.url) {
    return {
      error: new Error("Não foi possível iniciar o login com Google."),
    };
  }

  return new Promise((resolve) => {
    /** @type {import("@capacitor/core").PluginListenerHandle | null} */
    let urlListener = null;
    /** @type {import("@capacitor/core").PluginListenerHandle | null} */
    let browserFinishedListener = null;
    let settled = false;
    let callbackReceived = false;

    const cleanup = async () => {
      clearTimeout(timeoutId);
      try {
        await urlListener?.remove();
      } catch {
        /* ignore */
      }
      try {
        await browserFinishedListener?.remove();
      } catch {
        /* ignore */
      }
      try {
        await Browser.close();
      } catch {
        /* ignore */
      }
    };

    const finish = (result) => {
      if (settled) return;
      settled = true;
      void cleanup().finally(() => resolve(result));
    };

    const timeoutId = setTimeout(() => {
      finish({
        error: new Error("Login expirou. Feche o navegador e tente novamente."),
      });
    }, GOOGLE_DEEP_LINK_OAUTH_TIMEOUT_MS);

    const handleCallback = async (rawUrl) => {
      const parsed = parseNativeOAuthCallbackUrl(rawUrl);
      if (!parsed) return;

      callbackReceived = true;

      const code = parsed.searchParams.get("code");
      const oauthError = parsed.searchParams.get("error_description")
        || parsed.searchParams.get("error");

      if (oauthError || !code) {
        finish({
          error: new Error(
            oauthError
              ? String(oauthError)
              : "Login cancelado ou negado pelo Google."
          ),
        });
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        finish({ error: exchangeError });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await ensurePerfil(supabase, user);
        await registrarLog(supabase, user, "login", { provider: "google" });
      }

      const next = safeRedirectPath(parsed.searchParams.get("next") || postLoginPath);
      if (typeof window !== "undefined") {
        window.location.assign(next);
      }

      finish({ error: null });
    };

    void (async () => {
      try {
        urlListener = await App.addListener("appUrlOpen", (event) => {
          void handleCallback(event?.url);
        });

        browserFinishedListener = await Browser.addListener("browserFinished", () => {
          setTimeout(() => {
            if (!settled && !callbackReceived) {
              finish({ error: new Error("Login cancelado.") });
            }
          }, 400);
        });

        await Browser.open({ url: data.url });
      } catch (openError) {
        console.error("signInWithGoogleDeepLink:", openError);
        finish({
          error: new Error("Não foi possível abrir o login com Google."),
        });
      }
    })();
  });
}
