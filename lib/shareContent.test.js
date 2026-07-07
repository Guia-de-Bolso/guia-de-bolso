import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSharePublicUrl,
  getAtrativoShareUrl,
  getLugarShareUrl,
  isShareCancelled,
} from "./shareContent.js";

test("buildSharePublicUrl usa domínio público", () => {
  assert.equal(
    buildSharePublicUrl("/lugares/praia-da-vila/"),
    "https://guiadebolso.app/lugares/praia-da-vila/"
  );
});

test("getLugarShareUrl prefere slug", () => {
  assert.equal(
    getLugarShareUrl({ id: "uuid-1", slug: "zoca-restaurante" }),
    "https://guiadebolso.app/lugares/zoca-restaurante"
  );
});

test("getLugarShareUrl cai no id sem slug", () => {
  assert.equal(
    getLugarShareUrl({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    "https://guiadebolso.app/lugares/550e8400-e29b-41d4-a716-446655440000"
  );
});

test("getAtrativoShareUrl monta path de atrativo", () => {
  assert.equal(
    getAtrativoShareUrl("abc-123"),
    "https://guiadebolso.app/atrativos/abc-123"
  );
});

test("isShareCancelled detecta cancelamento do usuário", () => {
  assert.equal(isShareCancelled({ name: "AbortError" }), true);
  assert.equal(isShareCancelled({ message: "Share canceled" }), true);
  assert.equal(isShareCancelled(new Error("network fail")), false);
});

console.log("shareContent.test.js: ok");
