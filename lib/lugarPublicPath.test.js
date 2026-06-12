import assert from "node:assert/strict";
import {
  fetchLugarAtivoByRouteParam,
  getLugarPublicPath,
  isLugarUuidParam,
  isNumericLugarIdParam,
} from "./lugarPublicPath.js";

assert.equal(isLugarUuidParam("550e8400-e29b-41d4-a716-446655440000"), true);
assert.equal(isLugarUuidParam("praia-da-vila"), false);
assert.equal(isLugarUuidParam(""), false);

assert.equal(getLugarPublicPath({ slug: "z12", id: 12 }), "/lugares/z12");
assert.equal(
  getLugarPublicPath({ slug: "z12", id: 12 }, { from: "/categoria/Natureza" }),
  "/lugares/z12?from=%2Fcategoria%2FNatureza"
);
assert.equal(isNumericLugarIdParam("12"), true);
assert.equal(isNumericLugarIdParam("z12"), false);

assert.equal(getLugarPublicPath({ slug: "praia-da-vila", id: "550e8400-e29b-41d4-a716-446655440000" }), "/lugares/praia-da-vila");
assert.equal(
  getLugarPublicPath({ id: "550e8400-e29b-41d4-a716-446655440000" }),
  "/lugares/550e8400-e29b-41d4-a716-446655440000"
);

assert.equal(typeof fetchLugarAtivoByRouteParam, "function");

console.log("lugarPublicPath.test.js: ok");
