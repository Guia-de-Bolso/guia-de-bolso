import assert from "node:assert/strict";
import {
  ADMIN_ROTEIROS_NOVA_PATH,
  ADMIN_ROTEIROS_PATH,
  adminRoteiroEditarPath,
  favoritoRoteiroPath,
  isRoteirosPathname,
  ROTEIROS_PATH,
  roteiroDetalhePath,
} from "./roteirosPaths.js";

assert.equal(ROTEIROS_PATH, "/roteiros");
assert.equal(roteiroDetalhePath("abc"), "/roteiros/abc");
assert.equal(ADMIN_ROTEIROS_PATH, "/admin/roteiros");
assert.equal(ADMIN_ROTEIROS_NOVA_PATH, "/admin/roteiros/nova");
assert.equal(adminRoteiroEditarPath("abc"), "/admin/roteiros/abc/editar");
assert.equal(favoritoRoteiroPath("abc"), "/favoritos/roteiro/abc");

assert.equal(isRoteirosPathname("/roteiros"), true);
assert.equal(isRoteirosPathname("/roteiros/abc"), true);
assert.equal(isRoteirosPathname("/atrativos"), true);
assert.equal(isRoteirosPathname("/atrativos/abc"), true);
assert.equal(isRoteirosPathname("/favoritos"), false);

console.log("roteirosPaths.test.js: ok");
