import assert from "node:assert/strict";
import { getActiveServiceWorker, isServiceWorkerSupported } from "./serviceWorker.js";

assert.equal(isServiceWorkerSupported(), false);
assert.equal(await getActiveServiceWorker(), null);

console.log("serviceWorker.test.js: ok");

