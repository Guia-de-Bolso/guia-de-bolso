"use client";

import { Capacitor } from "@capacitor/core";
import {
  PLAY_PREMIUM_BASE_PLAN_ID,
  PLAY_PREMIUM_PRODUCT_ID,
  canPurchasePlayPremium,
} from "@/lib/playPremiumConfig";
import {
  getPlayBillingBlockerMessage,
  isNativePurchasesPluginAvailable,
} from "@/lib/playPremiumDiagnostics";
import { mapApiErrorResponse } from "@/lib/userMessages";

/**
 * @typedef {Object} PlayPremiumPurchaseResult
 * @property {boolean} ok
 * @property {import('@/lib/premium').PremiumUsage|null} [usage]
 * @property {string} [message]
 * @property {string} [code]
 * @property {boolean} [cancelled]
 */

/**
 * Carrega o plugin de compras nativas (somente no bundle do cliente).
 * @returns {Promise<typeof import('@capgo/native-purchases')>}
 */
async function loadNativePurchasesModule() {
  return import("@capgo/native-purchases");
}

/**
 * Verifica se billing está disponível no dispositivo Android.
 * @returns {Promise<boolean>}
 */
export async function isPlayBillingAvailable() {
  if (!canPurchasePlayPremium()) return false;

  const blocker = await getPlayBillingBlockerMessage();
  if (blocker) return false;

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
 * Envia compra ao backend para validação e ativação do Premium.
 * @param {{ purchaseToken: string, productId: string }} params
 * @returns {Promise<PlayPremiumPurchaseResult>}
 */
async function verifyPurchaseOnServer({ purchaseToken, productId }) {
  const response = await fetch("/api/premium/verify-play", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purchaseToken, productId }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const mapped = mapApiErrorResponse(data, response.status);
    return { ok: false, message: mapped.message, code: mapped.code ?? "SERVER" };
  }

  return { ok: true, usage: data.usage ?? null };
}

/**
 * Inicia fluxo de compra da assinatura Premium na Google Play.
 * @param {{ userId: string }} params
 * @returns {Promise<PlayPremiumPurchaseResult>}
 */
export async function purchasePlayPremium({ userId }) {
  if (!userId) {
    return { ok: false, code: "LOGIN_REQUIRED", message: "Faça login para assinar o Premium." };
  }

  if (!canPurchasePlayPremium()) {
    return {
      ok: false,
      code: "UNSUPPORTED",
      message: "Assinatura disponível apenas no app Android pela Play Store.",
    };
  }

  const blockerMessage = await getPlayBillingBlockerMessage();
  if (blockerMessage) {
    return {
      ok: false,
      code: "APP_UPDATE_REQUIRED",
      message: blockerMessage,
    };
  }

  const billingAvailable = await isPlayBillingAvailable();
  if (!billingAvailable) {
    return {
      ok: false,
      code: "BILLING_UNAVAILABLE",
      message:
        "Não foi possível conectar à Play Store para cobrança. Atualize o app Google Play no celular, confirme que instalou pelo link de Internal testing e tente de novo.",
    };
  }

  const { NativePurchases, PURCHASE_TYPE } = await loadNativePurchasesModule();

  let transaction;
  try {
    transaction = await NativePurchases.purchaseProduct({
      productIdentifier: PLAY_PREMIUM_PRODUCT_ID,
      planIdentifier: PLAY_PREMIUM_BASE_PLAN_ID,
      productType: PURCHASE_TYPE.SUBS,
      appAccountToken: userId.slice(0, 64),
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

  const purchaseToken = transaction?.purchaseToken?.trim();
  const productId = transaction?.productIdentifier?.trim() || PLAY_PREMIUM_PRODUCT_ID;

  if (!purchaseToken) {
    return {
      ok: false,
      code: "PURCHASE_INVALID",
      message: "Compra sem token de validação. Entre em contato com o suporte.",
    };
  }

  return verifyPurchaseOnServer({ purchaseToken, productId });
}

/**
 * Restaura compras ativas e valida no servidor (Android).
 * @returns {Promise<PlayPremiumPurchaseResult>}
 */
export async function restorePlayPremiumPurchases() {
  if (!canPurchasePlayPremium()) {
    return {
      ok: false,
      code: "UNSUPPORTED",
      message: "Restauração disponível apenas no app Android.",
    };
  }

  const { NativePurchases, PURCHASE_TYPE } = await loadNativePurchasesModule();
  await NativePurchases.restorePurchases();

  const { purchases } = await NativePurchases.getPurchases({
    productType: PURCHASE_TYPE.SUBS,
  });

  const match = (purchases ?? []).find(
    (purchase) => purchase.productIdentifier === PLAY_PREMIUM_PRODUCT_ID
  );

  if (!match?.purchaseToken) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Nenhuma assinatura Premium ativa encontrada nesta conta Google.",
    };
  }

  return verifyPurchaseOnServer({
    purchaseToken: match.purchaseToken,
    productId: match.productIdentifier || PLAY_PREMIUM_PRODUCT_ID,
  });
}

/**
 * Abre a tela nativa de gestão de assinaturas (Android).
 * @returns {Promise<void>}
 */
export async function openPlaySubscriptionManagement() {
  if (Capacitor.getPlatform() !== "android") return;
  const { NativePurchases } = await loadNativePurchasesModule();
  await NativePurchases.manageSubscriptions();
}
