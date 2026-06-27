"use client";

import { Capacitor } from "@capacitor/core";
import { getAppleAppAccountToken } from "@/lib/appleAccountToken";
import { APPLE_PREMIUM_PRODUCT_ID, canPurchaseApplePremium } from "@/lib/applePremiumConfig";
import { isNativePurchasesPluginAvailable } from "@/lib/playPremiumDiagnostics";
import { mapApiErrorResponse } from "@/lib/userMessages";

/**
 * @typedef {Object} ApplePremiumPurchaseResult
 * @property {boolean} ok
 * @property {import('@/lib/premium').PremiumUsage|null} [usage]
 * @property {string} [message]
 * @property {string} [code]
 * @property {boolean} [cancelled]
 */

/**
 * @returns {Promise<typeof import('@capgo/native-purchases')>}
 */
async function loadNativePurchasesModule() {
  return import("@capgo/native-purchases");
}

/**
 * @returns {Promise<boolean>}
 */
export async function isAppleBillingAvailable() {
  if (!canPurchaseApplePremium()) return false;
  if (!isNativePurchasesPluginAvailable()) return false;

  try {
    const { NativePurchases } = await loadNativePurchasesModule();
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    return Boolean(isBillingSupported);
  } catch {
    return false;
  }
}

/**
 * Carrega preço e nome da assinatura na App Store (obrigatório exibir na UI).
 * @returns {Promise<{ priceString: string|null, title: string|null }>}
 */
export async function getApplePremiumStoreProduct() {
  if (!canPurchaseApplePremium() || !isNativePurchasesPluginAvailable()) {
    return { priceString: null, title: null };
  }

  try {
    const { NativePurchases, PURCHASE_TYPE } = await loadNativePurchasesModule();
    const { product } = await NativePurchases.getProduct({
      productIdentifier: APPLE_PREMIUM_PRODUCT_ID,
      productType: PURCHASE_TYPE.SUBS,
    });

    return {
      priceString: product?.priceString ?? null,
      title: product?.title ?? null,
    };
  } catch {
    return { priceString: null, title: null };
  }
}

/**
 * @param {{ transactionId: string, productId: string, jwsRepresentation?: string|null }} params
 * @returns {Promise<ApplePremiumPurchaseResult>}
 */
async function verifyPurchaseOnServer({ transactionId, productId, jwsRepresentation = null }) {
  const response = await fetch("/api/premium/verify-apple", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionId, productId, jwsRepresentation }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const mapped = mapApiErrorResponse(data, response.status);
    return { ok: false, message: mapped.message, code: mapped.code ?? "SERVER" };
  }

  return { ok: true, usage: data.usage ?? null };
}

/**
 * @param {import('@capgo/native-purchases').Transaction|undefined|null} transaction
 * @returns {{ transactionId: string, productId: string, jwsRepresentation: string|null }|null}
 */
function extractAppleVerificationPayload(transaction) {
  const transactionId = transaction?.transactionId?.trim();
  const productId = transaction?.productIdentifier?.trim() || APPLE_PREMIUM_PRODUCT_ID;
  const jwsRepresentation =
    typeof transaction?.jwsRepresentation === "string" ? transaction.jwsRepresentation.trim() : null;

  if (!transactionId) return null;

  return { transactionId, productId, jwsRepresentation };
}

/**
 * Inicia fluxo de compra da assinatura Premium na App Store.
 * @param {{ userId: string }} params
 * @returns {Promise<ApplePremiumPurchaseResult>}
 */
export async function purchaseApplePremium({ userId }) {
  if (!userId) {
    return { ok: false, code: "LOGIN_REQUIRED", message: "Faça login para assinar o Premium." };
  }

  if (!canPurchaseApplePremium()) {
    return {
      ok: false,
      code: "UNSUPPORTED",
      message: "Assinatura disponível apenas no app iOS pela App Store.",
    };
  }

  const billingAvailable = await isAppleBillingAvailable();
  if (!billingAvailable) {
    return {
      ok: false,
      code: "BILLING_UNAVAILABLE",
      message:
        "Não foi possível conectar à App Store para cobrança. Confirme que instalou pelo TestFlight ou App Store e tente de novo.",
    };
  }

  const { NativePurchases, PURCHASE_TYPE } = await loadNativePurchasesModule();
  const appAccountToken = await getAppleAppAccountToken(userId);

  let transaction;
  try {
    transaction = await NativePurchases.purchaseProduct({
      productIdentifier: APPLE_PREMIUM_PRODUCT_ID,
      productType: PURCHASE_TYPE.SUBS,
      appAccountToken,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? "");
    const cancelled =
      /cancel/i.test(message) || /user.*cancel/i.test(message) || /E_USER_CANCELLED/i.test(message);

    if (cancelled) {
      return { ok: false, cancelled: true, code: "CANCELLED", message: "Compra cancelada." };
    }

    return {
      ok: false,
      code: "PURCHASE_FAILED",
      message: "Não foi possível concluir a compra. Tente novamente.",
    };
  }

  const payload = extractAppleVerificationPayload(transaction);
  if (!payload) {
    return {
      ok: false,
      code: "PURCHASE_INVALID",
      message: "Compra sem identificador de validação. Entre em contato com o suporte.",
    };
  }

  return verifyPurchaseOnServer(payload);
}

/**
 * Restaura compras ativas e valida no servidor (iOS).
 * @returns {Promise<ApplePremiumPurchaseResult>}
 */
export async function restoreApplePremiumPurchases() {
  if (!canPurchaseApplePremium()) {
    return {
      ok: false,
      code: "UNSUPPORTED",
      message: "Restauração disponível apenas no app iOS.",
    };
  }

  const { NativePurchases, PURCHASE_TYPE } = await loadNativePurchasesModule();
  await NativePurchases.restorePurchases();

  const { purchases } = await NativePurchases.getPurchases({
    productType: PURCHASE_TYPE.SUBS,
  });

  const match = (purchases ?? []).find(
    (purchase) => purchase.productIdentifier === APPLE_PREMIUM_PRODUCT_ID
  );

  const payload = extractAppleVerificationPayload(match);
  if (!payload) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Nenhuma assinatura Premium ativa encontrada nesta conta Apple.",
    };
  }

  return verifyPurchaseOnServer(payload);
}

/**
 * Abre a tela nativa de gestão de assinaturas (iOS).
 * @returns {Promise<void>}
 */
export async function openAppleSubscriptionManagement() {
  if (Capacitor.getPlatform() !== "ios") return;
  const { NativePurchases } = await loadNativePurchasesModule();
  await NativePurchases.manageSubscriptions();
}
