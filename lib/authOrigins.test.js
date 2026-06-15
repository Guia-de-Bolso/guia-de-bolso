import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_AUTH_ORIGIN,
  NATIVE_OAUTH_BRIDGE_PATH,
  NATIVE_OAUTH_CALLBACK,
  WEB_OAUTH_CALLBACK_PATH,
} from "./authOrigins.js";

test("authOrigins usa subdomínio do app, não marketing", () => {
  assert.equal(APP_AUTH_ORIGIN, "https://app.guiadebolso.app");
  assert.ok(!APP_AUTH_ORIGIN.includes("guiadebolso.app/app"));
  assert.equal(NATIVE_OAUTH_CALLBACK, "app.guiadebolso://auth/callback");
  assert.equal(NATIVE_OAUTH_BRIDGE_PATH, "/auth/native-return");
  assert.equal(WEB_OAUTH_CALLBACK_PATH, "/auth/callback");
});
