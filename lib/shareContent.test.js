import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSharePublicUrl,
  buildWebSharePayloads,
  getAtrativoShareUrl,
  getLugarShareUrl,
  isRecoverableShareError,
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

test("isRecoverableShareError permite fallback para clipboard", () => {
  assert.equal(isRecoverableShareError({ code: "UNIMPLEMENTED" }), true);
  assert.equal(isRecoverableShareError({ name: "NotAllowedError" }), true);
  assert.equal(isRecoverableShareError({ name: "AbortError" }), false);
});

test("buildWebSharePayloads tenta combinações menores por último", () => {
  const payloads = buildWebSharePayloads({
    title: "Zoca",
    text: "Restaurante",
    url: "https://guiadebolso.app/lugares/zoca",
  });

  assert.equal(payloads.at(-1)?.url, "https://guiadebolso.app/lugares/zoca");
  assert.equal(payloads.some((item) => item.url && !item.text && !item.title), true);
});

console.log("shareContent.test.js: ok");
