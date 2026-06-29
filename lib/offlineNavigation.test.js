import assert from "node:assert/strict";
import {
  FAVORITOS_OFFLINE_NAV_HREF,
  isAppHomePath,
  isFavoritosOfflineAllowedPath,
  isOfflineNavHrefAllowed,
} from "./offlineNavigation.js";

assert.equal(isAppHomePath("/"), true);
assert.equal(isAppHomePath("/home"), true);
assert.equal(isAppHomePath("/favoritos"), false);

assert.equal(isFavoritosOfflineAllowedPath("/favoritos"), true);
assert.equal(isFavoritosOfflineAllowedPath("/favoritos/lugar/1"), true);
assert.equal(isFavoritosOfflineAllowedPath("/categorias"), false);

assert.equal(isOfflineNavHrefAllowed(FAVORITOS_OFFLINE_NAV_HREF), true);
assert.equal(isOfflineNavHrefAllowed("/perfil"), false);

console.log("offlineNavigation.test.js: ok");
