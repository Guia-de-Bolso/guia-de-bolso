import assert from "node:assert/strict";
import {
  detectStorePlatform,
  getStoreUrlForPlatform,
  isStoreLinkConfigured,
} from "./appStoreLinks.js";

assert.equal(isStoreLinkConfigured("https://apps.apple.com/br/app/id123"), true);
assert.equal(isStoreLinkConfigured(""), false);
assert.equal(isStoreLinkConfigured("#"), false);

assert.equal(detectStorePlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), "ios");
assert.equal(detectStorePlatform("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "ios");
assert.equal(detectStorePlatform("Mozilla/5.0 (Linux; Android 14)"), "android");
assert.equal(detectStorePlatform("Mozilla/5.0 (Windows NT 10.0)"), "other");

assert.equal(
  getStoreUrlForPlatform("ios", {
    appStore: "https://apps.apple.com/br/app/id1",
    playStore: null,
  }),
  "https://apps.apple.com/br/app/id1"
);

assert.equal(
  getStoreUrlForPlatform("android", {
    appStore: "https://apps.apple.com/br/app/id1",
    playStore: "https://play.google.com/store/apps/details?id=app.guiadebolso",
  }),
  "https://play.google.com/store/apps/details?id=app.guiadebolso"
);

assert.equal(
  getStoreUrlForPlatform("ios", { appStore: null, playStore: "https://play.google.com/x" }),
  null
);

console.log("appStoreLinks.test.js: ok");
