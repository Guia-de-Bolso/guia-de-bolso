import assert from "node:assert/strict";
import {
  canAccessAdmin,
  canAccessAdminSection,
  canAccessDevAdmin,
  isDevOnlyAdminPath,
} from "./adminRoles.js";

assert.equal(canAccessAdmin("admin"), true);
assert.equal(canAccessAdmin("dev"), true);
assert.equal(canAccessAdmin("usuario"), false);

assert.equal(canAccessDevAdmin("dev"), true);
assert.equal(canAccessDevAdmin("admin"), false);

assert.equal(isDevOnlyAdminPath("/admin/usuarios"), true);
assert.equal(isDevOnlyAdminPath("/admin/locais"), false);
assert.equal(isDevOnlyAdminPath("/admin/locais/novo"), false);

assert.equal(canAccessAdminSection("admin", "/admin/avaliacoes"), true);
assert.equal(canAccessAdminSection("admin", "/admin/logs"), false);
assert.equal(canAccessAdminSection("dev", "/admin/logs"), true);

console.log("adminRoles.test.js OK");
