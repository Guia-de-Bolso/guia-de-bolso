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
