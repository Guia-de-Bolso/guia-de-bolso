import assert from "node:assert/strict";
import {
  APPLE_BUNDLE_ID,
  APPLE_PREMIUM_PRODUCT_ID,
  isApplePremiumConfigured,
} from "./applePremiumConfig.js";

assert.equal(APPLE_PREMIUM_PRODUCT_ID, "guia_premium_mensal");
assert.equal(APPLE_BUNDLE_ID, "app.guiadebolso");
assert.equal(isApplePremiumConfigured(), true);
