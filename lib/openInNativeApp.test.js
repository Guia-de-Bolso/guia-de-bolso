import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOpenInNativeAppHref } from "./openInNativeApp.js";

test("buildOpenInNativeAppHref monta intent no Android", () => {
  const href = buildOpenInNativeAppHref("/lugares/praia-da-vila/", "android");
  assert.ok(href.startsWith("intent://guiadebolso.app/lugares/praia-da-vila/"));
  assert.ok(href.includes("package=app.guiadebolso"));
});

test("buildOpenInNativeAppHref monta custom scheme no iOS", () => {
  const href = buildOpenInNativeAppHref("/lugares/praia-da-vila/", "ios");
  assert.equal(href, "app.guiadebolso://guiadebolso.app/lugares/praia-da-vila/");
});

console.log("openInNativeApp.test.js: ok");
