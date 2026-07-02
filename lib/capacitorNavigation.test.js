import assert from "node:assert/strict";
import { toCapacitorStaticHref } from "./capacitorNavigation.js";

assert.equal(toCapacitorStaticHref("/login?from=onboarding"), "/login/?from=onboarding");
assert.equal(toCapacitorStaticHref("/"), "/");
assert.equal(toCapacitorStaticHref("/favoritos"), "/favoritos/");

console.log("capacitorNavigation.test.js: ok");
