import assert from "node:assert/strict";
import test from "node:test";
import { activatePremiumFromApplePurchase } from "./premiumActivation.js";

const ORIGINAL_ID = "2000000000000001";
const RENEWAL_ID = "2000000999888777";

/**
 * @param {{ ownerId?: string|null, lookupError?: { message: string }|null, rpcData?: object }} [options]
 */
function createAdmin({ ownerId = null, lookupError = null, rpcData = { ok: true } } = {}) {
  const rpcCalls = [];
  const admin = {
    from(table) {
      assert.equal(table, "play_subscriptions");
      return {
        select() {
          return this;
        },
        eq(column, value) {
          assert.equal(column, "purchase_token");
          assert.equal(value, ORIGINAL_ID);
          return this;
        },
        maybeSingle: async () => ({
          data: ownerId ? { user_id: ownerId } : null,
          error: lookupError,
        }),
      };
    },
    rpc: async (name, args) => {
      rpcCalls.push({ name, args });
      return { data: rpcData, error: null };
    },
  };
  return { admin, rpcCalls };
}

const purchase = {
  transactionId: RENEWAL_ID,
  originalTransactionId: ORIGINAL_ID,
  productId: "guia_premium_mensal",
  expiresAt: "2026-12-01T00:00:00.000Z",
};

test("transação Apple já vinculada a outra conta não é reaproveitada", async () => {
  const { admin, rpcCalls } = createAdmin({ ownerId: "conta-original" });
  const result = await activatePremiumFromApplePurchase(admin, "conta-invasora", purchase);

  assert.equal(result.ok, false);
  assert.equal(result.code, "PURCHASE_INVALID");
  assert.equal(rpcCalls.length, 0);
});

test("restauração e renovação da mesma conta seguem para a RPC", async () => {
  const { admin, rpcCalls } = createAdmin({ ownerId: "conta-dona" });
  const result = await activatePremiumFromApplePurchase(admin, "conta-dona", purchase);

  assert.equal(result.ok, true);
  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0].args.p_user_id, "conta-dona");
  assert.equal(rpcCalls[0].args.p_purchase_token, ORIGINAL_ID);
  assert.equal(rpcCalls[0].args.p_order_id, RENEWAL_ID);
});

test("primeira vinculação usa a assinatura original", async () => {
  const { admin, rpcCalls } = createAdmin({ ownerId: null });
  const result = await activatePremiumFromApplePurchase(admin, "conta-nova", purchase);

  assert.equal(result.ok, true);
  assert.equal(rpcCalls[0].args.p_purchase_token, ORIGINAL_ID);
  assert.equal(rpcCalls[0].args.p_user_id, "conta-nova");
});

test("falha ao consultar o vínculo não ativa Premium", async () => {
  const { admin, rpcCalls } = createAdmin({
    lookupError: { message: "permission denied for table play_subscriptions" },
  });
  const result = await activatePremiumFromApplePurchase(admin, "conta-nova", purchase);

  assert.equal(result.ok, false);
  assert.equal(result.code, "SERVER");
  assert.equal(result.message.includes("play_subscriptions"), false);
  assert.equal(rpcCalls.length, 0);
});
