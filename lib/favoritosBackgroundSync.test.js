import assert from "node:assert/strict";
import {
  getLastBackgroundSyncAt,
  shouldRunBackgroundSync,
} from "./favoritosSyncThrottle.js";

assert.equal(getLastBackgroundSyncAt(), null);
assert.equal(shouldRunBackgroundSync(), true);

console.log("favoritosBackgroundSync.test.js: ok");
