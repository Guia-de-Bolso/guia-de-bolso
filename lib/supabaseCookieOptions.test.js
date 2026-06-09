import assert from "node:assert/strict";
import test from "node:test";
import { SUPABASE_AUTH_COOKIE_OPTIONS } from "./supabase/cookieOptions.js";

test("Supabase auth cookies are persistent and app-wide", () => {
  assert.equal(SUPABASE_AUTH_COOKIE_OPTIONS.path, "/");
  assert.equal(SUPABASE_AUTH_COOKIE_OPTIONS.sameSite, "lax");
  assert.equal(SUPABASE_AUTH_COOKIE_OPTIONS.httpOnly, false);
  assert.equal(SUPABASE_AUTH_COOKIE_OPTIONS.maxAge, 60 * 60 * 24 * 400);
});
