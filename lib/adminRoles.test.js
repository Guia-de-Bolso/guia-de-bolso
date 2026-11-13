import assert from "node:assert/strict";
import {
  canAccessAdmin,
  canAccessAdminSection,
  canAccessDevAdmin,
  decideAdminApiAccess,
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

const admin = { id: "admin-1", role: "admin" };
const dev = { id: "dev-1", role: "dev" };
const usuario = { id: "user-1", role: "usuario" };

assert.equal(decideAdminApiAccess({ user: null, perfil: admin }).status, 401);
assert.equal(decideAdminApiAccess({ user: usuario, perfil: usuario }).status, 403);
assert.equal(decideAdminApiAccess({ user: admin, perfil: admin, devOnly: false }).ok, true);
assert.equal(decideAdminApiAccess({ user: dev, perfil: dev, devOnly: false }).ok, true);
assert.equal(decideAdminApiAccess({ user: admin, perfil: admin, devOnly: true }).status, 403);
assert.equal(decideAdminApiAccess({ user: dev, perfil: dev, devOnly: true }).ok, true);
assert.equal(
  decideAdminApiAccess({ user: { id: "cookie-admin" }, perfil: dev }).status,
  403
);

console.log("adminRoles.test.js OK");
