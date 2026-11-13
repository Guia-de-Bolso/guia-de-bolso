/**
 * Ativa Premium no perfil após verificação de compra (service role + RPC).
 * @module lib/premiumActivation
 */

/**
 * @typedef {Object} PremiumActivationResult
 * @property {boolean} ok
 * @property {string} [code]
 * @property {string} [message]
 */

/**
 * Persiste assinatura Play e ativa Premium no perfil do usuário.
 * @param {import('@supabase/supabase-js').SupabaseClient} admin - Cliente service role.
 * @param {string} userId
 * @param {{ purchaseToken: string, productId: string, expiresAt?: string|null, orderId?: string|null }} purchase
 * @returns {Promise<PremiumActivationResult>}
 */
export async function activatePremiumFromPlayPurchase(admin, userId, purchase) {
  const { purchaseToken, productId, expiresAt = null, orderId = null } = purchase;

  const { data, error } = await admin.rpc("activate_premium_subscription", {
    p_user_id: userId,
    p_premium_ate: expiresAt,
    p_purchase_token: purchaseToken,
    p_product_id: productId,
    p_order_id: orderId,
  });

  if (error) {
    console.error("activate_premium_subscription RPC:", error.message);
    return {
      ok: false,
      code: "SERVER",
      message: "Não foi possível ativar o Premium na sua conta.",
    };
  }

  if (data?.ok === false) {
    return {
      ok: false,
      code: data.code ?? "PURCHASE_INVALID",
      message: data.message ?? "Compra não pôde ser vinculada à conta.",
    };
  }

  return { ok: true };
}

/**
 * A assinatura original já vinculada a outra conta não pode ser reaproveitada.
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} purchaseToken
 * @param {string} userId
 * @returns {Promise<PremiumActivationResult|null>} Erro, ou null quando a conta pode seguir.
 */
async function rejectIfAppleSubscriptionOwnedByOther(admin, purchaseToken, userId) {
  const { data, error } = await admin
    .from("play_subscriptions")
    .select("user_id")
    .eq("purchase_token", purchaseToken)
    .maybeSingle();

  if (error) {
    console.error("play_subscriptions lookup:", error.message);
    return {
      ok: false,
      code: "SERVER",
      message: "Não foi possível ativar o Premium na sua conta.",
    };
  }

  const ownerId = data?.user_id ? String(data.user_id) : "";
  if (ownerId && ownerId !== userId) {
    return {
      ok: false,
      code: "PURCHASE_INVALID",
      message: "Esta compra já está vinculada a outra conta.",
    };
  }

  return null;
}

/**
 * Persiste assinatura App Store e ativa Premium no perfil do usuário.
 * A chave é o originalTransactionId. Renovação e restauração da mesma conta atualizam a linha.
 * @param {import('@supabase/supabase-js').SupabaseClient} admin - Cliente service role.
 * @param {string} userId
 * @param {{ transactionId: string, originalTransactionId: string, productId: string, expiresAt?: string|null }} purchase
 * @returns {Promise<PremiumActivationResult>}
 */
export async function activatePremiumFromApplePurchase(admin, userId, purchase) {
  const {
    originalTransactionId,
    productId,
    expiresAt = null,
    transactionId = null,
  } = purchase;

  const purchaseToken = originalTransactionId?.trim() || "";
  if (!purchaseToken || !userId) {
    return {
      ok: false,
      code: "VALIDATION",
      message: "Transação da App Store incompleta.",
    };
  }

  const ownedByOther = await rejectIfAppleSubscriptionOwnedByOther(admin, purchaseToken, userId);
  if (ownedByOther) return ownedByOther;

  const { data, error } = await admin.rpc("activate_premium_subscription", {
    p_user_id: userId,
    p_premium_ate: expiresAt,
    p_purchase_token: purchaseToken,
    p_product_id: productId,
    p_order_id: transactionId,
  });

  if (error) {
    console.error("activate_premium_subscription RPC (apple):", error.message);
    return {
      ok: false,
      code: "SERVER",
      message: "Não foi possível ativar o Premium na sua conta.",
    };
  }

  if (data?.ok === false) {
    return {
      ok: false,
      code: data.code ?? "PURCHASE_INVALID",
      message: data.message ?? "Compra não pôde ser vinculada à conta.",
    };
  }

  return { ok: true };
}
