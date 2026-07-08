import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decodeJwtPayload,
  getTokenAudience,
  isAcceptedGoogleTokenAudience,
} from "./googleIdToken.js";
import { isUserCancelledError } from "./nativeSocialLoginInit.js";

describe("isUserCancelledError", () => {
  it("detecta code USER_CANCELLED", () => {
    assert.equal(isUserCancelledError({ code: "USER_CANCELLED" }), true);
  });

  it("detecta mensagem de cancelamento", () => {
    assert.equal(isUserCancelledError(new Error("User cancelled authorize")), true);
  });

  it("não marca erro real como cancelamento", () => {
    assert.equal(isUserCancelledError(new Error("Token do Google indisponível")), false);
  });
});

describe("decodeJwtPayload / getTokenAudience", () => {
  it("decodifica payload base64url", () => {
    const payload = Buffer.from(
      JSON.stringify({ aud: "web-client.apps.googleusercontent.com", sub: "1" })
    ).toString("base64url");
    const token = `hdr.${payload}.sig`;
    const decoded = decodeJwtPayload(token);
    assert.equal(decoded?.aud, "web-client.apps.googleusercontent.com");
    assert.equal(getTokenAudience(decoded), "web-client.apps.googleusercontent.com");
  });

  it("aceita aud em array", () => {
    assert.equal(getTokenAudience({ aud: ["a", "b"] }), "a");
  });
});

describe("isAcceptedGoogleTokenAudience", () => {
  it("aceita audience listada", () => {
    assert.equal(
      isAcceptedGoogleTokenAudience("web-id", ["web-id", "ios-id"]),
      true
    );
  });

  it("rejeita audience estranha", () => {
    assert.equal(isAcceptedGoogleTokenAudience("other", ["web-id"]), false);
  });
});
