import assert from "node:assert/strict";
import { createFavoritosSyncGuard } from "./favoritosSync.js";

const guard = createFavoritosSyncGuard();
const fetchGen = guard.bump();

assert.equal(guard.isCurrent(fetchGen), true);

guard.bump();

assert.equal(guard.isCurrent(fetchGen), false);

console.log("favoritos.test.js: ok");
