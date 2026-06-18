import { Capacitor } from "@capacitor/core";

/** Product ID da assinatura na Play Console (Monetize → Subscriptions). */
export const PLAY_PREMIUM_PRODUCT_ID =
  process.env.NEXT_PUBLIC_PLAY_PREMIUM_PRODUCT_ID?.trim() || "guia_premium_mensal";

/** Base Plan ID do plano mensal na Play Console. */
export const PLAY_PREMIUM_BASE_PLAN_ID =
  process.env.NEXT_PUBLIC_PLAY_PREMIUM_BASE_PLAN_ID?.trim() || "monthly";

/** Package name do app Android (`applicationId`). */
export const GOOGLE_PLAY_PACKAGE_NAME = "app.guiadebolso";

/**
 * Indica se os IDs públicos de assinatura estão configurados.
 * @returns {boolean}
 */
export function isPlayPremiumConfigured() {
  return Boolean(PLAY_PREMIUM_PRODUCT_ID && PLAY_PREMIUM_BASE_PLAN_ID);
}

/**
 * Compra Premium disponível apenas no app Android nativo (Capacitor).
 * @returns {boolean}
 */
export function canPurchasePlayPremium() {
  return (
    isPlayPremiumConfigured() &&
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}
