/**
 * Native Google on iOS requires GIDClientID in Info.plist (App Store build).
 * Default false → OAuth web no WebView até usuários atualizarem o app.
 * @returns {boolean}
 */
export function shouldUseIosNativeGoogleSignIn() {
  const flag = process.env.NEXT_PUBLIC_IOS_GOOGLE_NATIVE?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return false;
}
