import assert from "node:assert/strict";
import {
  OFFLINE_MAPS_PREPARE_BANNER,
  OFFLINE_MAPS_SHEET_TITLE,
  shouldShowOfflineMapsPrepareBanner,
} from "./offlineMaps.js";

assert.equal(typeof OFFLINE_MAPS_SHEET_TITLE, "string");
assert.ok(OFFLINE_MAPS_PREPARE_BANNER.includes("Imbituba"));

assert.equal(shouldShowOfflineMapsPrepareBanner("/favoritos", true), true);
assert.equal(shouldShowOfflineMapsPrepareBanner("/favoritos/lugar/abc", true), true);
assert.equal(shouldShowOfflineMapsPrepareBanner("/roteiros/abc", true), true);
assert.equal(shouldShowOfflineMapsPrepareBanner("/atrativos/abc", true), true);
assert.equal(shouldShowOfflineMapsPrepareBanner("/lugares/abc", true, "Natureza"), true);
assert.equal(shouldShowOfflineMapsPrepareBanner("/lugares/abc", true, "Gastronomia"), false);
assert.equal(shouldShowOfflineMapsPrepareBanner("/favoritos", false), false);
assert.equal(shouldShowOfflineMapsPrepareBanner("/", true), false);

console.log("offlineMaps.test.js: ok");
