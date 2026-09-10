import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAppLinkPath } from "./appLinks.js";

test("resolveAppLinkPath preserva query string", () => {
  assert.equal(
    resolveAppLinkPath("https://guiadebolso.app/lugares/x?from=/"),
    "/lugares/x?from=/"
  );
});

console.log("capacitorAppLinks.test.js: ok");
