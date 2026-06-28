import assert from "node:assert/strict";
import {
  buildOfflineFavoritoKey,
  buildOfflineMetaKey,
  formatOfflineSavedAt,
  FAVORITO_OFFLINE_TYPES,
} from "./favoritosOffline.js";

assert.equal(
  buildOfflineFavoritoKey("user-1", FAVORITO_OFFLINE_TYPES.LUGAR, "42"),
  "user-1:lugar:42"
);

assert.equal(
  buildOfflineFavoritoKey("user-1", FAVORITO_OFFLINE_TYPES.ATIVO, "abc"),
  "user-1:atrativo:abc"
);

assert.equal(buildOfflineMetaKey("user-1"), "user-1:meta");

assert.equal(formatOfflineSavedAt(null), null);
assert.equal(formatOfflineSavedAt("invalid"), null);

const formatted = formatOfflineSavedAt("2026-06-27T15:30:00.000Z");
assert.match(formatted, /27\/06\/2026/);

console.log("favoritosOffline.test.js: ok");
