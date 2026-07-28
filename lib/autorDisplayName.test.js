import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTOR_NOME_FALLBACK,
  emailLocalPart,
  isPlaceholderAutorNome,
  maskPhoneForDisplay,
  normalizeAutorDisplayNameInput,
  resolveAutorDisplayName,
  validateAutorDisplayNameInput,
} from "./autorDisplayName.js";

describe("isPlaceholderAutorNome", () => {
  it("treats empty and legacy labels as placeholders", () => {
    assert.equal(isPlaceholderAutorNome(""), true);
    assert.equal(isPlaceholderAutorNome("Usuário"), true);
    assert.equal(isPlaceholderAutorNome("Visitante"), true);
    assert.equal(isPlaceholderAutorNome("Maria"), false);
  });
});

describe("maskPhoneForDisplay", () => {
  it("keeps last 4 digits", () => {
    assert.equal(maskPhoneForDisplay("5521965100933"), "•••0933");
    assert.equal(maskPhoneForDisplay("123"), "");
  });
});

describe("emailLocalPart", () => {
  it("returns local part of email", () => {
    assert.equal(emailLocalPart("ariane@exemplo.com"), "ariane");
    assert.equal(emailLocalPart(""), "");
  });
});

describe("resolveAutorDisplayName", () => {
  it("prefers nome, then email, then phone, then Visitante", () => {
    assert.equal(
      resolveAutorDisplayName({
        nome: "Maria",
        email: "x@y.com",
        phone: "5511999999999",
      }),
      "Maria"
    );
    assert.equal(
      resolveAutorDisplayName({
        nome: "Usuário",
        email: "joao.silva@gmail.com",
        phone: "5511999999999",
      }),
      "joao.silva"
    );
    assert.equal(
      resolveAutorDisplayName({
        nome: "",
        email: "",
        phone: "5548998585449",
      }),
      "•••5449"
    );
    assert.equal(resolveAutorDisplayName({}), AUTOR_NOME_FALLBACK);
  });

  it("reads from supabase user object", () => {
    assert.equal(
      resolveAutorDisplayName({
        user: {
          email: null,
          phone: "5521965100933",
          user_metadata: {},
        },
      }),
      "•••0933"
    );
  });
});

describe("validateAutorDisplayNameInput", () => {
  it("requires a real display name", () => {
    assert.equal(validateAutorDisplayNameInput("A").ok, false);
    assert.equal(validateAutorDisplayNameInput("Usuário").ok, false);
    assert.deepEqual(validateAutorDisplayNameInput("  Ana  "), {
      ok: true,
      nome: "Ana",
    });
  });

  it("normalizes whitespace and length", () => {
    assert.equal(normalizeAutorDisplayNameInput("  Ana   Clara  "), "Ana Clara");
  });
});
