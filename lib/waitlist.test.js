import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidWaitlistEmail,
  normalizeWaitlistOrigem,
  sanitizeWaitlistEmail,
} from "./waitlist.js";

describe("sanitizeWaitlistEmail", () => {
  it("normaliza para minúsculas e trim", () => {
    assert.equal(sanitizeWaitlistEmail("  Ana@Mail.COM  "), "ana@mail.com");
  });

  it("retorna null para vazio", () => {
    assert.equal(sanitizeWaitlistEmail("   "), null);
  });
});

describe("isValidWaitlistEmail", () => {
  it("aceita e-mail válido", () => {
    assert.equal(isValidWaitlistEmail("turista@exemplo.com"), true);
  });

  it("rejeita e-mail inválido", () => {
    assert.equal(isValidWaitlistEmail("invalido"), false);
    assert.equal(isValidWaitlistEmail(""), false);
  });
});

describe("normalizeWaitlistOrigem", () => {
  it("aceita origens conhecidas", () => {
    assert.equal(normalizeWaitlistOrigem("landing-hero"), "landing-hero");
    assert.equal(normalizeWaitlistOrigem("landing-final"), "landing-final");
  });

  it("fallback para landing", () => {
    assert.equal(normalizeWaitlistOrigem("desconhecido"), "landing");
  });
});
