import assert from "node:assert/strict";
import {
  decodeAppleJwsPayload,
  normalizeApplePrivateKey,
  validateAppleTransactionPayload,
  verifyAppleSubscriptionFromJws,
} from "./appleBillingVerify.js";

const samplePayload = Buffer.from(JSON.stringify({ productId: "guia_premium_mensal" })).toString(
  "base64url"
);
const sampleJws = `aaa.${samplePayload}.bbb`;
const decoded = decodeAppleJwsPayload(sampleJws);

assert.equal(decoded?.productId, "guia_premium_mensal");

const bareKey = "MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgabc123";
const normalized = normalizeApplePrivateKey(bareKey);

assert.match(normalized ?? "", /^-----BEGIN PRIVATE KEY-----\n/);
assert.match(normalized ?? "", /\n-----END PRIVATE KEY-----\n?$/);

const futureExpiry = Date.now() + 86_400_000;
const subscriptionPayload = Buffer.from(
  JSON.stringify({
    bundleId: "app.guiadebolso",
    productId: "guia_premium_mensal",
    transactionId: "2000000123456789",
    originalTransactionId: "2000000123456789",
    expiresDate: futureExpiry,
  })
).toString("base64url");
const subscriptionJws = `aaa.${subscriptionPayload}.bbb`;

const verified = verifyAppleSubscriptionFromJws(subscriptionJws, "guia_premium_mensal");
assert.equal(verified.valid, true);
assert.equal(verified.productId, "guia_premium_mensal");

const wrongProduct = validateAppleTransactionPayload(
  { bundleId: "app.guiadebolso", productId: "outro_produto", expiresDate: futureExpiry },
  "guia_premium_mensal"
);
assert.equal(wrongProduct.valid, false);
