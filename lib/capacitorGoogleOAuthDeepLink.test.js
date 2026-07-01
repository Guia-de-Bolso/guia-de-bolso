import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNativeOAuthRedirectUrl,
  NATIVE_OAUTH_CALLBACK_PREFIX,
  parseNativeOAuthCallbackUrl,
} from "./capacitorOAuthUrls.js";
import { shouldUseIosNativeGoogleSignIn } from "./iosGoogleSignInMode.js";

test("buildNativeOAuthRedirectUrl uses deep link scheme", () => {
  assert.equal(
    buildNativeOAuthRedirectUrl("/perfil"),
    "app.guiadebolso://auth/callback?next=%2Fperfil"
  );
  assert.equal(buildNativeOAuthRedirectUrl("/"), "app.guiadebolso://auth/callback");
});

test("parseNativeOAuthCallbackUrl accepts oauth callback URLs", () => {
  const parsed = parseNativeOAuthCallbackUrl(
    "app.guiadebolso://auth/callback?code=abc123&next=%2F"
  );
  assert.ok(parsed);
  assert.equal(parsed.searchParams.get("code"), "abc123");
  assert.equal(parseNativeOAuthCallbackUrl("https://example.com"), null);
  assert.equal(parseNativeOAuthCallbackUrl("app.guiadebolso://other"), null);
  assert.equal(NATIVE_OAUTH_CALLBACK_PREFIX, "app.guiadebolso://auth/callback");
});

test("shouldUseIosNativeGoogleSignIn defaults to false (deep link OAuth on iOS)", () => {
  const previous = process.env.NEXT_PUBLIC_IOS_GOOGLE_NATIVE;
  delete process.env.NEXT_PUBLIC_IOS_GOOGLE_NATIVE;
  assert.equal(shouldUseIosNativeGoogleSignIn(), false);
  process.env.NEXT_PUBLIC_IOS_GOOGLE_NATIVE = "true";
  assert.equal(shouldUseIosNativeGoogleSignIn(), true);
  process.env.NEXT_PUBLIC_IOS_GOOGLE_NATIVE = "0";
  assert.equal(shouldUseIosNativeGoogleSignIn(), false);
  if (previous === undefined) {
    delete process.env.NEXT_PUBLIC_IOS_GOOGLE_NATIVE;
  } else {
    process.env.NEXT_PUBLIC_IOS_GOOGLE_NATIVE = previous;
  }
});
