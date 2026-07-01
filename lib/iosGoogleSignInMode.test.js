import assert from "node:assert/strict";
import test from "node:test";

import { shouldUseIosNativeGoogleSignIn } from "./iosGoogleSignInMode.js";

test("shouldUseIosNativeGoogleSignIn defaults to false (web OAuth on iOS)", () => {
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
