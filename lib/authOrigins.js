/**
 * Origens OAuth — fonte única.
 *
 * Web (browser): redirect para /auth/callback no host atual.
 *
 * App nativo (Capacitor): Google Sign-In nativo via @capgo/capacitor-social-login
 * (sem Custom Tab nem deep link). Requer NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID na Vercel.
 * iOS: também NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID + URL scheme em ios/GoogleAuth.xcconfig.
 *
 * Apple Sign-In nativo no iOS via SocialLogin + signInWithIdToken (entitlements já configurados).
 *
 * Supabase → Redirect URLs (só para login web):
 * - https://app.guiadebolso.app/auth/callback
 * - https://guiadebolso.app/auth/callback
 */

/** WebView do app Capacitor. */
export const APP_AUTH_ORIGIN = "https://app.guiadebolso.app";

/** Legado — deep link mantido no manifest para futuros fluxos (ex.: Apple). */
export const NATIVE_OAUTH_CALLBACK = "app.guiadebolso://auth/callback";

/** Callback OAuth no browser. */
export const WEB_OAUTH_CALLBACK_PATH = "/auth/callback";
