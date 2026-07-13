import assert from "node:assert/strict";
import test from "node:test";
import {
  validateAdminPushPayload,
  validatePushPlatform,
  validatePushToken,
} from "./pushTokenValidation.js";

test("validatePushToken aceita token não vazio", () => {
  const result = validatePushToken("abc123");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.token, "abc123");
});

test("validatePushToken rejeita vazio", () => {
  const result = validatePushToken("   ");
  assert.equal(result.ok, false);
});

test("validatePushPlatform aceita ios e android", () => {
  assert.equal(validatePushPlatform("ios").ok, true);
  assert.equal(validatePushPlatform("android").ok, true);
  assert.equal(validatePushPlatform("web").ok, false);
});

test("validateAdminPushPayload exige destinatários e campos", () => {
  const invalid = validateAdminPushPayload({ title: "Oi", body: "Teste" });
  assert.equal(invalid.ok, false);

  const valid = validateAdminPushPayload({
    title: "Destaque",
    body: "Confira a praia da semana",
    userIds: ["11111111-1111-1111-1111-111111111111"],
    url: "/lugares/abc",
  });

  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.url, "/lugares/abc");
    assert.equal(valid.userIds.length, 1);
  }
});

test("validateAdminPushPayload rejeita URL externa", () => {
  const result = validateAdminPushPayload({
    title: "Teste",
    body: "Corpo",
    userIds: ["11111111-1111-1111-1111-111111111111"],
    url: "https://evil.example",
  });

  assert.equal(result.ok, false);
});
