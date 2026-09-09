import assert from "node:assert/strict";
import {
  explorarApiCacheHeaders,
  lugaresApiCacheHeaders,
} from "./apiCacheHeaders.js";

const lugares = lugaresApiCacheHeaders();
assert.equal(typeof lugares["Cache-Control"], "string");
assert.match(lugares["Cache-Control"], /s-maxage=/);
assert.match(lugares["Cache-Control"], /stale-while-revalidate=/);

const explorar = explorarApiCacheHeaders();
assert.match(explorar["Cache-Control"], /no-store/);
assert.doesNotMatch(explorar["Cache-Control"], /s-maxage=/);

console.log("apiCacheHeaders.test.js: ok");
