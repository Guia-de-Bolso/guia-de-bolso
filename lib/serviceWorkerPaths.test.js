import assert from "node:assert/strict";
import {
  buildFavoritosPrecachePaths,
  FAVORITOS_OFFLINE_PATH,
  isFavoritosOfflinePath,
} from "./serviceWorkerPaths.js";

assert.equal(isFavoritosOfflinePath("/favoritos"), true);
assert.equal(isFavoritosOfflinePath("/favoritos/"), true);
assert.equal(isFavoritosOfflinePath("/favoritos/lugar/abc"), true);
assert.equal(isFavoritosOfflinePath("/favoritos/atrativo/uuid"), true);
assert.equal(isFavoritosOfflinePath("/"), false);
assert.equal(isFavoritosOfflinePath("/atrativos"), false);

const paths = buildFavoritosPrecachePaths([{ id: 1 }], [{ id: "r2" }]);
assert.ok(paths.includes(FAVORITOS_OFFLINE_PATH));
assert.ok(paths.includes("/favoritos/lugar/1"));
assert.ok(paths.includes("/favoritos/atrativo/r2"));

console.log("serviceWorkerPaths.test.js: ok");
