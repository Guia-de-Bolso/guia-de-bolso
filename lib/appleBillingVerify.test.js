import assert from "node:assert/strict";
import { decodeAppleJwsPayload, normalizeApplePrivateKey } from "./appleBillingVerify.js";

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
