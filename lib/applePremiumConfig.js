import { Capacitor } from "@capacitor/core";

/** Product ID da assinatura no App Store Connect (Subscriptions). */
export const APPLE_PREMIUM_PRODUCT_ID =
  process.env.NEXT_PUBLIC_APPLE_PREMIUM_PRODUCT_ID?.trim() || "guia_premium_mensal";

/** Bundle ID do app iOS (`appId` do Capacitor). */
export const APPLE_BUNDLE_ID = "app.guiadebolso";

/**
 * Indica se o Product ID público da assinatura Apple está configurado.
 * @returns {boolean}
 */
export function isApplePremiumConfigured() {
  return Boolean(APPLE_PREMIUM_PRODUCT_ID);
}

/**
 * Compra Premium disponível apenas no app iOS nativo (Capacitor).
 * @returns {boolean}
 */
export function canPurchaseApplePremium() {
  return (
    isApplePremiumConfigured() &&
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "ios"
  );
}
