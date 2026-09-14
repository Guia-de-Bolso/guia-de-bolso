import assert from "node:assert/strict";
import {
  getPushNotificationTargetPath,
  isSamePushAppPath,
  normalizePushAppPath,
  shouldSkipPushLaunchWait,
} from "./pushNotificationOpen.js";

assert.equal(
  getPushNotificationTargetPath({ data: { url: "/lugares/abc" } }),
  "/lugares/abc"
);
assert.equal(getPushNotificationTargetPath({ data: { url: "https://evil.com" } }), null);
assert.equal(getPushNotificationTargetPath({ data: {} }), null);
assert.equal(getPushNotificationTargetPath(null), null);

assert.equal(normalizePushAppPath("/lugares/abc"), "/lugares/abc/");
assert.equal(normalizePushAppPath("/lugares/abc/"), "/lugares/abc/");
assert.equal(normalizePushAppPath("/login?from=x"), "/login/?from=x");
assert.equal(normalizePushAppPath("/"), "/");

assert.equal(isSamePushAppPath("/lugares/abc", "/lugares/abc/"), true);
assert.equal(isSamePushAppPath("/lugares/abc/", "/outro/"), false);
assert.equal(isSamePushAppPath("/login?from=x", "/login/?from=x"), true);

assert.equal(shouldSkipPushLaunchWait(1000, "500", 600), true);
assert.equal(shouldSkipPushLaunchWait(2000, "500", 600), false);
assert.equal(shouldSkipPushLaunchWait(1000, null), false);
assert.equal(shouldSkipPushLaunchWait(1000, "nope"), false);

console.log("pushNotificationOpen.test.js: ok");
