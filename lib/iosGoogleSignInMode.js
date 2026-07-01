/**
 * Sign-In nativo do Google no iOS (SDK + GIDClientID no Info.plist).
 * Ative com NEXT_PUBLIC_IOS_GOOGLE_NATIVE=true após publicar build 1.0.10+ na App Store.
 * Enquanto false, o app usa OAuth via Browser + deep link app.guiadebolso://auth/callback.
 * @returns {boolean}
 */
export function shouldUseIosNativeGoogleSignIn() {
  const flag = process.env.NEXT_PUBLIC_IOS_GOOGLE_NATIVE?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return false;
}
