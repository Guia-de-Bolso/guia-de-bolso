import assert from "node:assert/strict";
import { isBrowserOnline } from "./networkStatus.js";

assert.equal(typeof isBrowserOnline(), "boolean");

console.log("networkStatus.test.js: ok");
