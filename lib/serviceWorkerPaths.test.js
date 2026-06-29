import assert from "node:assert/strict";
import {
  buildFavoritosPrecachePaths,
  FAVORITOS_OFFLINE_PATH,
  isFavoritosDetailPath,
  isFavoritosListPath,
  isFavoritosOfflinePath,
  isNextRouterDataRequest,
} from "./serviceWorkerPaths.js";

assert.equal(isFavoritosOfflinePath("/favoritos"), true);
assert.equal(isFavoritosOfflinePath("/favoritos/"), true);
assert.equal(isFavoritosOfflinePath("/favoritos/lugar/abc"), true);
assert.equal(isFavoritosOfflinePath("/favoritos/atrativo/uuid"), true);
assert.equal(isFavoritosOfflinePath("/"), false);
assert.equal(isFavoritosOfflinePath("/atrativos"), false);

assert.equal(isFavoritosListPath("/favoritos"), true);
assert.equal(isFavoritosListPath("/favoritos/"), true);
assert.equal(isFavoritosDetailPath("/favoritos/lugar/abc"), true);
assert.equal(isFavoritosDetailPath("/favoritos"), false);

assert.equal(
  isNextRouterDataRequest(
    new Request("https://app.guiadebolso.app/favoritos/lugar/1", {
      headers: { rsc: "1" },
    })
  ),
  true
);
assert.equal(
  isNextRouterDataRequest(
    new Request("https://app.guiadebolso.app/favoritos/lugar/1", {
      headers: { accept: "text/x-component" },
    })
  ),
  true
);
assert.equal(
  isNextRouterDataRequest(
    new Request("https://app.guiadebolso.app/favoritos/lugar/1")
  ),
  false
);

const paths = buildFavoritosPrecachePaths([{ id: 1 }], [{ id: "r2" }]);
assert.ok(paths.includes(FAVORITOS_OFFLINE_PATH));
assert.ok(paths.includes("/favoritos/lugar/1"));
assert.ok(paths.includes("/favoritos/atrativo/r2"));

console.log("serviceWorkerPaths.test.js: ok");
