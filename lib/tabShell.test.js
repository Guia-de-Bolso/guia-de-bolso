import assert from "node:assert/strict";
import { isBottomNavRoot, resolveBottomNavTab } from "./tabShell.js";

assert.deepEqual(resolveBottomNavTab("/"), { root: "/", isRoot: true });
assert.deepEqual(resolveBottomNavTab("/categorias"), {
  root: "/categorias",
  isRoot: true,
});
assert.deepEqual(resolveBottomNavTab("/categoria/Servi%C3%A7os"), {
  root: "/categorias",
  isRoot: false,
});
assert.deepEqual(resolveBottomNavTab("/roteiros"), {
  root: "/roteiros",
  isRoot: true,
});
assert.deepEqual(resolveBottomNavTab("/favoritos"), {
  root: "/favoritos",
  isRoot: true,
});
assert.deepEqual(resolveBottomNavTab("/perfil"), { root: "/perfil", isRoot: true });

assert.deepEqual(resolveBottomNavTab("/favoritos/lugar/abc"), {
  root: "/favoritos",
  isRoot: false,
});
assert.deepEqual(resolveBottomNavTab("/favoritos/roteiro/abc"), {
  root: "/favoritos",
  isRoot: false,
});
assert.deepEqual(resolveBottomNavTab("/perfil/editar"), {
  root: "/perfil",
  isRoot: false,
});

assert.deepEqual(resolveBottomNavTab("/lugares/praia"), {
  root: "/",
  isRoot: false,
});
assert.deepEqual(resolveBottomNavTab("/roteiros/abc"), {
  root: "/roteiros",
  isRoot: false,
});
assert.equal(resolveBottomNavTab(null).root, null);

assert.equal(isBottomNavRoot("/perfil"), true);
assert.equal(isBottomNavRoot("/perfil/editar"), false);

console.log("tabShell.test.js: ok");
