"use client";

import { Capacitor } from "@capacitor/core";
import {
  getApplePremiumStoreProduct,
  purchaseApplePremium,
  restoreApplePremiumPurchases,
} from "@/lib/applePremiumPurchase";
import { canPurchaseApplePremium } from "@/lib/applePremiumConfig";
import { canPurchasePlayPremium } from "@/lib/playPremiumConfig";
import {
  purchasePlayPremium,
  restorePlayPremiumPurchases,
} from "@/lib/playPremiumPurchase";

/**
 * @typedef {Object} NativePremiumPurchaseResult
 * @property {boolean} ok
 * @property {import('@/lib/premium').PremiumUsage|null} [usage]
 * @property {string} [message]
 * @property {string} [code]
 * @property {boolean} [cancelled]
 */

/**
 * Compra in-app disponível no app nativo Android ou iOS.
 * @returns {boolean}
 */
export function canPurchaseNativePremium() {
  return canPurchasePlayPremium() || canPurchaseApplePremium();
}

/**
 * @returns {'google_play'|'app_store'|null}
 */
export function getNativePremiumStore() {
  if (canPurchasePlayPremium()) return "google_play";
  if (canPurchaseApplePremium()) return "app_store";
  return null;
}

/**
 * @returns {Promise<{ priceString: string|null, title: string|null }>}
 */
export async function getNativePremiumStoreProduct() {
  if (canPurchaseApplePremium()) {
    return getApplePremiumStoreProduct();
  }

  return { priceString: null, title: null };
}

/**
 * @param {{ userId: string }} params
 * @returns {Promise<NativePremiumPurchaseResult>}
 */
export async function purchaseNativePremium({ userId }) {
  if (canPurchasePlayPremium()) {
    return purchasePlayPremium({ userId });
  }

  if (canPurchaseApplePremium()) {
    return purchaseApplePremium({ userId });
  }

  return {
    ok: false,
    code: "UNSUPPORTED",
    message: "Assinatura disponível apenas nos apps Android e iOS.",
  };
}

/**
 * @returns {Promise<NativePremiumPurchaseResult>}
 */
export async function restoreNativePremiumPurchases() {
  if (canPurchasePlayPremium()) {
    return restorePlayPremiumPurchases();
  }

  if (canPurchaseApplePremium()) {
    return restoreApplePremiumPurchases();
  }

  return {
    ok: false,
    code: "UNSUPPORTED",
    message: "Restauração disponível apenas nos apps Android e iOS.",
  };
}

/**
 * @returns {string}
 */
export function getNativePremiumBillingDisclaimer() {
  const store = getNativePremiumStore();

  if (store === "google_play") {
    return "Cobrança via Google Play. Renovação automática até cancelar nas configurações da Play Store.";
  }

  if (store === "app_store") {
    return "Cobrança via App Store. Renovação automática até cancelar em Ajustes > Apple ID > Assinaturas.";
  }

  return "";
}

/**
 * @returns {boolean}
 */
export function isNativePremiumPlatform() {
  return Capacitor.isNativePlatform() && Boolean(getNativePremiumStore());
}
