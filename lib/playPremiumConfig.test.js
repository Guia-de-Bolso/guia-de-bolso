import assert from "node:assert/strict";
import {
  GOOGLE_PLAY_PACKAGE_NAME,
  PLAY_PREMIUM_BASE_PLAN_ID,
  PLAY_PREMIUM_PRODUCT_ID,
  isPlayPremiumConfigured,
} from "./playPremiumConfig.js";

assert.equal(PLAY_PREMIUM_PRODUCT_ID, "guia_premium_mensal");
assert.equal(PLAY_PREMIUM_BASE_PLAN_ID, "monthly");
assert.equal(GOOGLE_PLAY_PACKAGE_NAME, "app.guiadebolso");
assert.equal(isPlayPremiumConfigured(), true);
