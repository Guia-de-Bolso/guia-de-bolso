/**
 * Origens e caminhos de OAuth — fonte única para web e Capacitor.
 *
 * Supabase → Authentication → URL Configuration → Redirect URLs (todas obrigatórias):
 * - https://app.guiadebolso.app/auth/callback
 * - https://app.guiadebolso.app/auth/native-return
 * - app.guiadebolso://auth/callback
 * - https://guiadebolso.app/auth/callback (login web no domínio de marketing)
 */

/** WebView do app nativo (Capacitor) — nunca usar guiadebolso.app aqui. */
export const APP_AUTH_ORIGIN = "https://app.guiadebolso.app";

/** Deep link que o Android abre de volta ao app após OAuth na Custom Tab. */
export const NATIVE_OAUTH_CALLBACK = "app.guiadebolso://auth/callback";

/** Callback padrão (browser / web app). */
export const WEB_OAUTH_CALLBACK_PATH = "/auth/callback";

/**
 * Ponte HTTPS → deep link (só app nativo).
 * Supabase redireciona aqui; a rota devolve HTML/redirect para o scheme do app.
 */
export const NATIVE_OAUTH_BRIDGE_PATH = "/auth/native-return";
