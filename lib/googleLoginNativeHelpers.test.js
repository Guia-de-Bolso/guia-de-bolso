import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapAndroidGoogleCancelToError,
  withGoogleLoginTimeout,
} from "./googleLoginNativeHelpers.js";

describe("mapAndroidGoogleCancelToError", () => {
  it("no Android transforma USER_CANCELLED em erro de configuração", () => {
    const error = mapAndroidGoogleCancelToError(
      {
        code: "USER_CANCELLED",
        message: "Google Sign-In cancelled by user",
      },
      "android"
    );

    assert.ok(error instanceof Error);
    assert.match(error.message, /SHA-1/i);
  });

  it("no iOS mantém cancelamento silencioso", () => {
    assert.equal(
      mapAndroidGoogleCancelToError({ code: "USER_CANCELLED" }, "ios"),
      null
    );
  });
});

describe("withGoogleLoginTimeout", () => {
  it("rejeita quando a promise demora demais", async () => {
    await assert.rejects(
      withGoogleLoginTimeout(
        new Promise(() => {}),
        20,
        "timeout de teste"
      ),
      /timeout de teste/
    );
  });

  it("resolve quando a promise conclui a tempo", async () => {
    const value = await withGoogleLoginTimeout(
      Promise.resolve("ok"),
      50,
      "timeout de teste"
    );
    assert.equal(value, "ok");
  });
});
