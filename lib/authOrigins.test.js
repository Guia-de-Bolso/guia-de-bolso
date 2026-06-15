import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_AUTH_ORIGIN,
  NATIVE_OAUTH_CALLBACK,
  WEB_OAUTH_CALLBACK_PATH,
} from "./authOrigins.js";

test("authOrigins usa subdomínio do app para OAuth", () => {
  assert.equal(APP_AUTH_ORIGIN, "https://app.guiadebolso.app");
  assert.equal(NATIVE_OAUTH_CALLBACK, "app.guiadebolso://auth/callback");
  assert.equal(WEB_OAUTH_CALLBACK_PATH, "/auth/callback");
});
