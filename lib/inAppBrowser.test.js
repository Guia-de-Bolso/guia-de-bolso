import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectOpenInAppPlatform,
  isWhatsAppInAppBrowser,
} from "./inAppBrowser.js";

test("isWhatsAppInAppBrowser detecta UA do WhatsApp", () => {
  assert.equal(
    isWhatsAppInAppBrowser("Mozilla/5.0 WhatsApp/2.23.20.0"),
    true
  );
  assert.equal(isWhatsAppInAppBrowser("Mozilla/5.0 Chrome/120"), false);
});

test("detectOpenInAppPlatform identifica android e ios", () => {
  assert.equal(detectOpenInAppPlatform("Mozilla/5.0 (Linux; Android 14)"), "android");
  assert.equal(detectOpenInAppPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17)"), "ios");
});

console.log("inAppBrowser.test.js: ok");
